# Subagent 병렬 실행 Instruction

> CLAUDE.md, ARCHITECTURE.md, IMPLEMENTATION.md를 모두 먼저 읽으세요.
> 현재 Phase 0, 2, 4가 완료됐고, Phase 1(Neo4j)과 Phase 3(LangGraph Agent)이 stub 상태입니다.
> 이 instruction을 subagent 패턴으로 병렬 처리하세요.

---

## 전체 설계 원칙

**모든 외부 서비스(Neo4j, Claude API, ChromaDB)에 "없으면 Mock fallback" 패턴을 적용합니다.**
- 환경변수/API 키가 없으면 기존 Mock 데이터로 동작
- 키를 넣는 순간 실제 서비스로 전환
- 발표 시 "Mock이지만 API 연결하면 바로 프로덕션" 가능

---

## Subagent 1: Neo4j + Graph API

**담당 영역:** `backend/db/`, `backend/api/v1/graph.py`, `backend/mock_data/neo4j_seed.cypher`

**목표:** Mock 고정값을 실제 Neo4j 쿼리로 교체 (미연결 시 기존 Mock 유지)

### 작업 목록

1. `backend/requirements.txt`에 `neo4j` 패키지 추가 후 설치

2. `db/neo4j_client.py` 구현:
   - Neo4j Aura 연결 (환경변수: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`)
   - 환경변수 없으면 Mock fallback으로 동작 (현재처럼)
   - `get_subgraph(entity_id)` 함수: 2-hop Cypher 쿼리

3. `mock_data/neo4j_seed.cypher` 정리:
   - IMPLEMENTATION.md의 SKU 8종, 거래처 데이터 기반
   - 노드: `(:SKU)`, `(:Account)`, `(:Channel)`, `(:Brand)`, `(:Region)`
   - 관계: `LOCATED_IN`, `OPERATES_IN`, `ORDERS`, `BELONGS_TO`, `ORIGIN`
   - 폐업 거래처 3곳에 `status: "closed"` 프로퍼티

4. `api/v1/graph.py` 수정:
   - Neo4j 연결 시 → 실제 Cypher 쿼리 결과 반환
   - Neo4j 미연결 시 → 기존 Mock 데이터 반환 (graceful fallback)

5. 테스트:
   ```bash
   curl http://localhost:8000/api/v1/graph/gangnam-wholesale
   ```

---

## Subagent 2: LangGraph Agent

**담당 영역:** `backend/agent/` 전체, `backend/api/v1/analyze.py`

**목표:** 4개 stub 노드를 실제 구현으로 교체하고, analyze.py의 Mock 응답을 Agent 실행으로 교체

### 작업 목록

1. `backend/requirements.txt`에 추가 후 설치:
   - `langgraph`, `langchain-core`, `langchain-anthropic`, `chromadb`

2. `agent/state.py` 구현:
   ```python
   class NaraState(TypedDict):
       alert: dict              # {"region": "강남", "channel": "도매", ...}
       gathered_data: dict      # Neo4j + ChromaDB 수집 결과
       root_causes: list        # [{"depth": 1, "text": "..."}, ...]
       actions: list            # [{"id": "ACT-001", "title": "...", ...}]
       human_decision: Optional[str]  # "approve" | "revise" | None
   ```

3. `agent/nodes/` 4개 노드 구현:

   **a) `anomaly_detector.py`:**
   - SQLite에서 해당 alert의 지역/채널 매출 데이터 조회
   - z-score 계산 (IMPLEMENTATION.md 공식: `abs(change_pct) / 7.0`)
   - `State.alert`에 `z_score`, `threshold`, `detail` 추가

   **b) `data_gatherer.py`:**
   - Tool 1 — `neo4j_query`: 해당 지역 거래처-SKU 관계 조회
     - Neo4j 미연결 시 Mock 데이터 반환
   - Tool 2 — `vector_search`: ChromaDB에서 유사 사례 검색
     - ChromaDB 미설정 시 Mock 유사 사례 3건 반환
   - 두 결과를 `State.gathered_data`에 저장

   **c) `root_cause_analyzer.py`:**
   - Claude API (Sonnet)에게 `gathered_data` 전달
   - 프롬프트:
     > "다음 데이터를 기반으로 매출 하락의 원인을 분석해줘.
     > depth 1(직접 원인), depth 2(구조적 원인), depth 3(시장 트렌드)로 나눠서.
     > JSON 배열로 반환: [{"depth": 1, "text": "..."}, ...]"
   - API 키 없으면 → IMPLEMENTATION.md의 Mock causes 반환
   - `State.root_causes`에 저장

   **d) `action_recommender.py`:**
   - Claude API에게 `root_causes` + `gathered_data` 전달
   - 프롬프트:
     > "원인 분석 결과를 기반으로 구체적인 액션 3개를 추천해줘.
     > 각 액션에 id, title, desc, impact, confidence를 포함.
     > JSON 배열로 반환."
   - API 키 없으면 → IMPLEMENTATION.md의 Mock actions 3개 반환
   - `State.actions`에 저장

4. `agent/graph.py` — LangGraph 워크플로우 연결:
   ```
   START → anomaly_detector → data_gatherer → root_cause_analyzer → action_recommender → END
   ```
   - conditional edge: `anomaly_detector`에서 이상 없으면 바로 END

5. `api/v1/analyze.py` 수정:
   - Mock `asyncio.sleep` 루프를 실제 LangGraph `astream()` 호출로 교체
   - 각 노드 완료 시 SSE `event: step` 전송
   - LangGraph 실행 실패 시 → 기존 Mock 응답으로 fallback
   - SSE 이벤트 포맷은 IMPLEMENTATION.md 섹션 4-4 그대로 유지

6. 테스트:
   ```bash
   curl "http://localhost:8000/api/v1/analyze?alert_id=ALT-001"
   ```
   - SSE 스트림이 4개 step + done 이벤트를 정상 전송하는지 확인

---

## Subagent 3: Frontend 데이터 연동

**담당 영역:** `frontend/` 디렉토리

**목표:** 하드코딩된 부분을 실제 API 호출로 교체 + 에러 핸들링 강화

### 작업 목록

1. `components/SalesChart.tsx` 수정:
   - 하드코딩 데이터 제거
   - `fetch(`${API_BASE}/api/v1/alerts`)`로 받은 alert의 region/channel 기반으로
     백엔드에서 매출 추이를 가져오도록 수정
   - 또는 `/api/v1/kpi` 응답에 `sales_trend` 필드를 추가해서 사용
   - 현재 하드코딩 값(3780, 4120, ...)은 fallback으로 유지

2. 에러 핸들링 강화:
   - 백엔드 꺼져있을 때 → 각 컴포넌트에 "서버 연결 실패" 메시지 표시
   - SSE 연결 실패 시 → `AnalysisStream`에 재시도 버튼 추가
   - fetch 타임아웃 5초 설정

3. 테스트:
   - 백엔드 켜진 상태에서 `localhost:3001/dashboard` 접속 → 정상 동작
   - 백엔드 꺼진 상태에서도 크래시 없이 에러 메시지만 표시되는지 확인

---

## 통합 테스트 (모든 subagent 완료 후)

### 실행 순서

```bash
# 터미널 1
cd backend && uvicorn main:app --reload --port 8000

# 터미널 2
cd frontend && npm run dev
```

### E2E 시나리오 체크리스트

1. **Overview 탭:**
   - [ ] KPI 4개 카드에 SQLite 계산값 표시
   - [ ] SalesChart에 API에서 가져온 매출 추이 표시
   - [ ] AlertList에 "강남 도매 -20%", "홍대 리테일 -15%" 표시

2. **Knowledge Graph 탭:**
   - [ ] 그래프 노드/엣지 렌더링
   - [ ] 폐업 거래처 빨간 점선 + ✕ 표시

3. **Root Cause 분석 탭:**
   - [ ] Alert "강남 도매 -20%" 클릭 → 탭 자동 전환
   - [ ] "분석 시작" 버튼 → SSE 스트리밍 4단계 순차 표시
   - [ ] 원인 트리: depth 1→2→3 계층 표시
   - [ ] 액션 카드 3개 + "실행" 버튼 → 시뮬레이션 결과

4. **Fallback 확인:**
   - [ ] Neo4j 미연결 상태에서도 Graph 탭 정상 (Mock)
   - [ ] Claude API 키 없어도 분석 탭 정상 (Mock 원인/액션)
   - [ ] 백엔드 꺼져있을 때 프론트 크래시 없음

### 완료 후

CLAUDE.md 섹션 11(현재 진행 상황)을 업데이트:
- Phase 1, 3 완료 표시
- Neo4j/LLM API 키 없어도 Mock fallback으로 전체 시나리오 작동 확인
- 다음 단계: API 키 연결 시 실제 AI 분석으로 전환 가능
