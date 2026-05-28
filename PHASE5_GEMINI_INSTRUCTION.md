# Phase 5: 최종 완성 — Gemini API + Neo4j Aura Free 기반

> **선행 조건:** CLAUDE.md, ARCHITECTURE.md, IMPLEMENTATION.md를 모두 읽으세요.
> Phase 0~4 완료 상태에서, 남은 모든 작업을 subagent로 병렬 처리합니다.
> **LLM은 Anthropic 대신 Google Gemini (무료)를 사용합니다.**

---





### 3) backend/.env 파일 생성

```bash
# Google Gemini (무료)
GOOGLE_API_KEY=AIza여기에_복사한_키

# Neo4j Aura Free (무료)
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=여기에_복사한_비밀번호
```

**여기까진 내가 해뒀으니 잘 들어가있는지만 확인인**

**.gitignore에 .env 추가 확인!**

---

## Subagent 1: Anthropic → Gemini 전환 + Agent 실제 연결

**담당 영역:** `backend/agent/nodes/`, `backend/api/v1/analyze.py`, `backend/requirements.txt`

### 작업 목록

1. `requirements.txt` 수정:
   - `langchain-anthropic` 제거 (또는 주석 처리)
   - `langchain-google-genai` 추가
   - `google-generativeai` 추가 (의존성)
   - pip install -r requirements.txt 실행

2. `agent/nodes/root_cause_analyzer.py` 수정:
   - import 변경:
     ```python
     # 변경 전
     # from langchain_anthropic import ChatAnthropic
     # 변경 후
     from langchain_google_genai import ChatGoogleGenerativeAI
     ```
   - 모델 초기화 변경:
     ```python
     # 변경 전
     # llm = ChatAnthropic(model="claude-sonnet-4-6", api_key=os.getenv("ANTHROPIC_API_KEY"))
     # 변경 후
     llm = ChatGoogleGenerativeAI(
         model="gemini-2.0-flash",
         google_api_key=os.getenv("GOOGLE_API_KEY")
     )
     ```
   - 환경변수 체크 변경:
     ```python
     # 변경 전
     # if not os.getenv("ANTHROPIC_API_KEY"):
     # 변경 후
     if not os.getenv("GOOGLE_API_KEY"):
         return _mock_causes()  # Mock fallback
     ```
   - 프롬프트는 동일하게 유지 (Gemini도 같은 프롬프트로 작동)
   - Claude 프롬프트에서 "Claude" 언급이 있으면 제거
   - JSON 응답 파싱: ```json 코드블록 strip 처리 유지
   - 파싱 실패 시 Mock fallback (크래시 절대 안 됨)

3. `agent/nodes/action_recommender.py` 동일하게 수정:
   - ChatAnthropic → ChatGoogleGenerativeAI
   - ANTHROPIC_API_KEY → GOOGLE_API_KEY
   - model="claude-sonnet-4-6" → model="gemini-2.0-flash"
   - Mock fallback 로직 동일 유지

4. `agent/nodes/data_gatherer.py` 점검:
   - ANTHROPIC_API_KEY 참조가 있으면 GOOGLE_API_KEY로 변경
   - Neo4j 호출과 ChromaDB 호출이 정상 작동하는지 확인

5. `api/v1/analyze.py` 점검:
   - LangGraph astream() 호출이 정상 작동하는지 확인
   - 각 노드에서 Gemini 응답이 SSE로 스트리밍되는지 확인
   - 노드 실행 중 에러 발생 시 해당 노드만 Mock으로 대체하고 계속 진행

6. CLAUDE.md 업데이트:
   - 기술 스택에서 "Claude Sonnet" → "Google Gemini 2.0 Flash" 로 변경
   - 환경변수 목록에서 ANTHROPIC_API_KEY → GOOGLE_API_KEY

7. 테스트:
   ```bash
   # .env에 GOOGLE_API_KEY 설정된 상태
   curl "http://localhost:8000/api/v1/analyze?alert_id=ALT-001"
   ```
   - Gemini가 생성한 원인/액션이 SSE로 스트리밍되는지 확인
   - 원인 분석이 나라셀라 맥락에 맞는지 확인

---

## Subagent 2: Neo4j Aura Free 실제 연결

**담당 영역:** `backend/db/neo4j_client.py`, `backend/mock_data/neo4j_seed.cypher`

### 작업 목록

1. `mock_data/neo4j_seed.cypher` 최종 점검:
   - IMPLEMENTATION.md의 노드 구성과 일치하는지 확인
   - 모든 MERGE 구문 멱등성 보장
   - 인덱스 생성 구문 포함
   - 검증 쿼리 추가:
     ```cypher
     MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC;
     MATCH (start {id: "gangnam"})-[r1]-(mid)-[r2]-(end)
     RETURN start.id, type(r1), mid.id, type(r2), end.id LIMIT 20;
     ```

2. Neo4j Aura에 seed 데이터 넣기:
   - Neo4j 콘솔(console.neo4j.io)에서 인스턴스 클릭 → Query 탭
   - neo4j_seed.cypher 내용을 복사-붙여넣기 → 실행
   - 검증 쿼리로 데이터 확인

3. `db/neo4j_client.py` 점검:
   - 2-hop Cypher 쿼리가 관계 타입과 일치하는지 확인
   - 노드의 status 프로퍼티(closed/active) 포함되는지 확인
   - Neo4j 연결 실패 시 graceful fallback 확인
   - 응답에 "source": "neo4j" 또는 "source": "mock" 필드 추가

4. 테스트:
   ```bash
   curl http://localhost:8000/api/v1/graph/gangnam-wholesale
   ```

---

## Subagent 3: ChromaDB 벡터 검색 실제 연동

**담당 영역:** `backend/db/chroma_client.py`, `backend/agent/nodes/data_gatherer.py`

### 작업 목록

1. `db/chroma_client.py` 구현:
   - ChromaDB 로컬 인스턴스 (persist_directory="./chroma_db")
   - 서버 시작 시 컬렉션 초기화 + 초기 데이터 10건 적재:
     ```python
     documents = [
         "2023년 10월 이태원 도매 15% 하락 — 할로윈 사고 이후 유동인구 감소",
         "2022년 12월 강남 리테일 12% 하락 — 경기 침체, 프리미엄 와인 소비 위축",
         "2021년 7월 홍대 도매 18% 하락 — 코로나 4차 유행",
         "2023년 3월 부산 온라인 25% 상승 — 편의점 와인 프로모션 효과",
         "2024년 1월 강남 도매 8% 하락 — 연초 소비 위축 패턴",
         "2022년 6월 홍대 리테일 22% 상승 — 하이볼 트렌드 확산",
         "2023년 9월 전국 도매 10% 하락 — 추석 수요 예상 하회",
         "2024년 5월 강남 리테일 15% 상승 — 와인 페어링 이벤트 효과",
         "2021년 11월 부산 도매 20% 하락 — 호텔 2곳 계약 해지",
         "2024년 8월 홍대 온라인 30% 상승 — MZ 타겟 소용량 라인 론칭",
     ]
     ```
   - `search_similar_cases(query, n_results=3)` 함수 구현

2. `agent/nodes/data_gatherer.py` 수정:
   - `_get_vector_results()`에서 chroma_client 호출
   - 실패 시 Mock 유사 사례 3건 반환

3. main.py의 lifespan에 ChromaDB 초기화 추가:
   ```python
   from db.chroma_client import init_chroma
   
   async def lifespan(app):
       init_db()      # SQLite
       init_chroma()  # ChromaDB
       yield
   ```

4. 테스트: analyze 실행 시 data_gatherer의 vector_results 확인

---

## Subagent 4: UI 폴리싱 + 발표 품질

**담당 영역:** `frontend/` 전체

### 작업 목록

1. **전체 레이아웃**:
   - 헤더에 "삼일회계법인 AX Node" 텍스트
   - 탭 전환 시 fade 트랜지션

2. **KpiCard**: 숫자 카운트업 애니메이션 (0 → 348, 500ms)

3. **SalesChart**: Y축 "만원" 단위, 3월 급락에 annotation "거래처 3곳 폐업"

4. **AnalysisStream**:
   - 노드 완료 시 체크마크 애니메이션
   - 진행 중 소요시간 카운터
   - 전체 완료 후 "총 소요시간: X.Xs"
   - 분석 중 버튼 비활성화

5. **CauseTree**: depth 간 연결선 + fade-in 애니메이션

6. **ActionCard**:
   - 신뢰도 프로그레스 바 (0.8+ 초록, 0.6~0.8 노랑)
   - 실행 후 로딩 스피너 → 결과 아코디언

7. **KnowledgeGraph**: 폐업 거래처에 "폐업" 라벨

8. **에러 상태 통일**: 빨간 테두리 + 아이콘 + 메시지 + 재시도 버튼

9. **빌드 확인**: `npm run build` 에러 0개

---

## 통합 테스트 (모든 subagent 완료 후)

### E2E 시나리오 체크리스트

```bash
# 터미널 1
cd backend && uvicorn main:app --reload --port 8000

# 터미널 2
cd frontend && npm run dev
```

1. **Overview 탭**
   - [ ] KPI 4개 카드 카운트업 표시
   - [ ] SalesChart API 데이터 표시, 3월 빨간 점
   - [ ] AlertList "강남 도매 -20%", "홍대 리테일 -15%"

2. **Knowledge Graph 탭**
   - [ ] Neo4j 실데이터 그래프 (source: "neo4j")
   - [ ] 폐업 거래처 빨간 점선 + ✕ + "폐업" 라벨

3. **Root Cause 분석 탭**
   - [ ] "분석 시작" → SSE 4단계 스트리밍
   - [ ] data_gatherer: Neo4j 실데이터 + ChromaDB 유사 사례
   - [ ] root_cause_analyzer: **Gemini가 생성한 실제 원인 분석**
   - [ ] action_recommender: **Gemini가 생성한 실제 액션 추천**
   - [ ] 액션 "실행" → 시뮬레이션 결과

4. **Fallback 확인**
   - [ ] GOOGLE_API_KEY 삭제 → Mock 원인/액션 정상
   - [ ] NEO4J_URI 삭제 → Mock 그래프 정상
   - [ ] 백엔드 꺼져있을 때 프론트 크래시 없음

### 완료 후

CLAUDE.md, IMPLEMENTATION.md 업데이트:
- 모든 Phase 완료
- LLM: Google Gemini 2.0 Flash (무료)
- Graph DB: Neo4j Aura Free (무료)
- Vector DB: ChromaDB (로컬 무료)
- 전체 스택 무료로 운영 가능
