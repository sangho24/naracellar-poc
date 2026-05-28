# 나라셀라 디지털 전환 PoC 대시보드

> 이 파일은 프로젝트의 "뇌"입니다. 모든 코드 작성 전에 이 파일을 읽으세요.
> 이 PoC는 삼일회계법인 AX Node가 나라셀라 대상으로 작성한 디지털 전환 제안서의 데모입니다.

---

## 1. 회사 개요

나라셀라는 한국의 와인 수입 유통사입니다.
- 161 브랜드, 1,955 SKU, 570 거래처, 10+ 채널
- 주요 브랜드: 케이머스(미국), 몬테스(칠레), 부샤(프랑스)
- 계열사 8개: NARA USA, 소주스토리, 나라스피릿 등
- 직영매장 10여개, 3PL 물류 전환 과도기

---

## 2. As-Is — 현재 문제 (제안서 Slide 3-5)

### 시장 환경
- 와인 수입량 3년간 32% 감소 (76,575t → 52,036t, 2021→2024)
- 병당 판매가 17% 하락 (vs 2022)
- 프리미엄 와인(이탈리아·미국·호주) 판매 급감
- 2024년 거래처(레스토랑, 와인바) 20여 곳 폐업
- MZ세대 와인 → 위스키·무알코올로 이탈 가속
- 편의점 와인 급성장 — 소비 채널의 구조적 변화
- 업계 전망: "2008년 금융위기보다 더 어려운 상황"

### 매출 구조 편중
- 미국(케이머스 외) 42%, 프랑스(부샤 외) 18%, 칠레(몬테스 외) 16%
- 상위 3개국 = 76%
- 161 브랜드, 1,955 SKU 보유 → 영업 현장에서 추천되는 건 극히 일부

### 재고 문제
- 재고보유일수: 348일 (2022년 215일 → +133일 증가)
- 재고평가충당금: 2.86억 (시장가 < 원가)
- 미착상품: 102억 (전체 재고의 25%)
- 문제는 "재고가 많은 것"이 아니라 "안 팔리는 재고가 늘고 있다는 것"

### 채널 사일로
- 영업1(Off), 영업2(On), 리테일 분리 — 각 팀이 자기 채널 데이터만 봄
- 크로스채널 최적화 불가
- 프로모션 ROI 측정 도구 없음

### 재무적 문제
- 현금 고갈: 44억 vs 부채 316억
- 재고에 자본 묶임
- 환리스크: 외화부채 73억, 5% 변동 시 3.6억 영향
- 매출채권 연체: 25.4억 (18.6%), 대손충당금 매년 2억↑
- 이자 부담: 연 16억
- 계열사 8개 미연결, 매장 POS 연동 불명확
- 영업손실 2.3억 (2025.3Q)
- "감" 기반 의사결정

---

## 3. To-Be — 목표 비전 (제안서 Slide 6-7)

> "포트폴리오 전체가 살아 있는 회사"
> "1,955개 SKU × 570 거래처 × 10+ 채널, 이 조합을 영업사원의 머리로 풀 수는 없습니다. 이건 AI Agent의 영역입니다."

### 4대 전환 효과
1. **Long Tail 소진**: 비인기 SKU가 맞는 거래처에 연결 → 재고보유일수 정상화
2. **거래처 차별화**: "나라셀라와 거래하면 우리 매장에 맞는 와인을 추천받을 수 있다"
3. **얼로케이션 선순환**: "한국에서 잘 팔린다" → 와이너리 물량 확대 → 포트폴리오 강화
4. **상장 비전 달성**: 인기 와인 + Long Tail → 매출 2,500억 경로 재활성화

### 전환 경로 (아래→위)
- 클라우드 인프라 + 자동화 → 양질의 데이터 축적 → 개인화된 추천 (AI Agent) → 포트폴리오 전체가 살아 있는 회사
- "데이터를 쌓는 것이 환차손·대손을 줄이는 기반이 되고, 자동화가 현금흐름을 개선하고, AI가 매출을 성장시킵니다."

---

## 4. 기대효과 (제안서 Slide 12)

| 항목 | 현재 | 전환 후 | 효과 |
|------|------|---------|------|
| 재고보유일수 | 348일 | 250일 | ~100억 재고 감소, 이자 연 4~5억↓ |
| 환리스크 | 수동 헤지 | 실시간 추적 + 자동 알림 | 연 1~2억 절감 |
| 매출채권 | 대손충당금 매년 2억↑ | 거래처 신용스코링 | 연 2~3억 절감 |
| 클라우드 전환 | 온프레미스 사일로 | CapEx→OpEx 통합 | IT 관리비 ~30%↓ |
| Long Tail 매출 | 소진 어려움 | AI Agent 매칭 | 전체 매출 5~10%↑ |

> "현재 영업손실 2.3억 → 비용절감 효과만으로 흑자 전환 가능"

---

## 5. PoC 데모 시나리오

이 PoC는 아래 시나리오 하나가 end-to-end로 작동하는 것을 목표로 합니다:

**시나리오: "강남 도매 매출 20% 하락"**

1. **감지**: 대시보드 KPI에서 강남 도매 채널 매출이 전월 대비 20% 하락 감지 (Alert 카드)
2. **분석 시작**: 사용자가 "Root Cause 분석" 버튼 클릭
3. **데이터 수집**: Agent가 Neo4j Knowledge Graph에서 강남 지역 거래처-SKU-브랜드 관계 조회 + ChromaDB에서 유사 과거 사례 검색
4. **원인 분석 (단계별)**:
   - Depth 1: 강남 도매 매출 20% 하락
   - Depth 2: 거래처 3곳 폐업 (레스토랑 2, 와인바 1) / 프리미엄 와인 수요 급감
   - Depth 3: MZ세대 위스키·무알코올 이탈 / 편의점 채널 구조적 성장 → 도매 잠식
5. **액션 추천**:
   - 액션 1: 중저가 칠레 와인(몬테스 클래식) 20% 할인 쿠폰 → 잔존 거래처 44곳 대상
   - 액션 2: 편의점 채널(GS25·CU) 신규 입점 — Long Tail SKU 5종 소용량(187ml) 패키징
   - 액션 3: 잔존 레스토랑 대상 '와인 페어링 메뉴 최적화' 컨설팅 데이터 제공
6. **실행**: 사용자가 "실행" 버튼 → 시뮬레이션 결과 표시 (예상 매출 +12%)

---

## 6. 대시보드에 반드시 보여야 할 것

### Overview 탭
- **KPI 카드 4개**: 재고보유일수(348일), 매출채권 연체율(18.6%), 환리스크 노출(73억), Long Tail 소진율(12%)
- **매출 추이 차트**: 최근 7개월 강남 도매 채널, 3월에 급락 하이라이트
- **Alert 리스트**: 이상 감지 목록 (강남 도매 -20%, 홍대 리테일 -15% 등)

### Knowledge Graph 탭
- **관계 그래프 시각화**: 강남 도매 → 거래처(폐업 표시) → SKU → 국가/브랜드
- Neo4j 2-hop 탐색 결과를 그래프로 렌더링
- 노드 색상: 지역(파랑), 거래처(보라), SKU(주황), 국가(초록), 폐업(빨강 점선)

### Root Cause 분석 탭
- **Agent 실행 스트리밍**: 분석 시작 → 각 노드 단계별 실시간 표시
  - anomaly_detector → data_gatherer → root_cause_analyzer → action_recommender
- **원인 트리**: Depth 1→2→3 단계별 원인, 들여쓰기로 계층 표현
- **액션 카드**: 각 추천 액션별 설명 + 예상 효과 + 신뢰도 + "실행" 버튼
- **Knowledge Graph**: 분석 탭에서도 관련 그래프 함께 표시

---

## 7. 기술 스택

- Frontend: Next.js 14 (App Router), Tailwind CSS, Recharts
- Backend: FastAPI (Python 3.11)
- Agent: LangGraph + LangChain
- DB: Neo4j Aura (graph), ChromaDB (vector), SQLite (mock ERP)
- LLM: Claude API (Sonnet)
- MCP: mcp-neo4j-cypher, mcp-neo4j-memory

---

## 8. 프로젝트 구조

```
naraselllar-poc/
├── frontend/                # Next.js 앱
│   ├── app/
│   │   ├── dashboard/       # 메인 대시보드 페이지
│   │   ├── components/      # KpiCard, AlertList, AnalysisStream, KnowledgeGraph, ActionCard
│   │   └── layout.tsx
│   └── package.json
├── backend/                 # FastAPI 서버
│   ├── api/
│   │   └── v1/
│   │       ├── kpi.py       # GET /api/v1/kpi
│   │       ├── alerts.py    # GET /api/v1/alerts
│   │       ├── analyze.py   # POST /api/v1/analyze (SSE 스트리밍)
│   │       ├── graph.py     # GET /api/v1/graph/{entity_id}
│   │       └── actions.py   # POST /api/v1/actions/{action_id}/execute
│   ├── agent/
│   │   ├── state.py         # NaraState (TypedDict)
│   │   ├── nodes/
│   │   │   ├── anomaly_detector.py
│   │   │   ├── data_gatherer.py
│   │   │   ├── root_cause_analyzer.py
│   │   │   └── action_recommender.py
│   │   ├── tools/
│   │   │   ├── neo4j_query.py
│   │   │   └── vector_search.py
│   │   └── graph.py         # LangGraph 워크플로우 정의
│   ├── db/
│   │   ├── neo4j_client.py
│   │   ├── chroma_client.py
│   │   └── sqlite_client.py
│   ├── mock_data/
│   │   ├── sales.csv
│   │   ├── inventory.csv
│   │   ├── accounts.csv
│   │   └── neo4j_seed.cypher
│   ├── main.py              # FastAPI 앱 진입점
│   └── requirements.txt
├── docs/
│   └── ARCHITECTURE.md      # 상세 설계 문서
└── CLAUDE.md                # 이 파일
```

---

## 9. 구현 진행 상황 (2026-03-16 기준)

### Phase 0 — 스캐폴딩 [완료]
- [x] `backend/` FastAPI 프로젝트 구조 생성 (모든 파일 TODO 상태로)
- [x] `frontend/` Next.js 프로젝트 구조 생성 (모든 컴포넌트 stub으로)
- [x] `backend/mock_data/` — sales.csv, inventory.csv, accounts.csv 설계
  - 강남/도매 2월 4,000만원 → 3월 3,200만원 (-20%) 수학적으로 설계
  - 홍대/리테일 2월 2,000만원 → 3월 1,700만원 (-15%) 수학적으로 설계
  - 폐업 거래처(rest1, rest2, wine1) 3월 매출 = 0으로 처리

### Phase 1 — Neo4j/ChromaDB 연동 [완료]
- [x] `mock_data/neo4j_seed.cypher` — MERGE 기반 시드 스크립트 (4 브랜드국, 3 지역, 3 채널, 7 SKU, 8 거래처(폐업3), 전체 관계)
- [x] `db/neo4j_client.py` — `NEO4J_URI` 환경변수 존재 시 실제 Neo4j 2-hop Cypher 쿼리, 없으면 Mock fallback
- [x] `api/v1/graph.py` — `get_subgraph(entity_id)` 호출로 교체, Pydantic V2 `Field(alias="from")` + `model_validate()` 처리
- **Neo4j API 키 없어도 Mock fallback으로 전체 그래프 시나리오 작동 확인**

### Phase 2 — 백엔드 API 구현 [완료]
- [x] `db/sqlite_client.py` — CSV→SQLite 적재, init_db(), get_kpi_metrics(), get_monthly_sales_by_channel()
- [x] `api/v1/kpi.py` — inventory_days, overdue_rate, longtail_rate, fx_exposure 계산
- [x] `api/v1/alerts.py` — 전월대비 -15% 이하 자동 감지 (강남도매 -20%, 홍대리테일 -15%)
- [x] `api/v1/analyze.py` — SSE 스트리밍 Mock (4노드 × 1~2초 지연), ARCHITECTURE.md 포맷 정확히 일치
- [x] `api/v1/actions.py` — ACT-001/002/003 시뮬레이션 결과 반환
- [x] `api/v1/graph.py` — Pydantic V2 호환 수정 (Field alias + model_validate)
- [x] `main.py` — lifespan 컨텍스트 매니저로 서버 시작 시 init_db() 자동 실행
- [x] 전체 엔드포인트 curl 테스트 통과

**테스트 결과 요약:**
```
GET  /health                          → {"status":"ok","version":"0.2.0"}
GET  /api/v1/kpi                      → inventory_days=362, overdue_rate=19.4%, longtail_rate=13.2%
GET  /api/v1/alerts                   → ALT-001 강남/도매 -20.0%, ALT-002 홍대/리테일 -15.0%
POST /api/v1/actions/ACT-001/execute  → revenue_change_pct=12.0, roi=3.2
GET  /api/v1/graph/gangnam-wholesale  → 11 nodes, 12 edges (폐업 3곳 포함)
GET  /api/v1/analyze?alert_id=ALT-001 → 4 SSE step 이벤트 + done 이벤트
```

**알려진 차이값 (Mock 데이터 한계):**
- inventory_days: 362일 (목표 348일) — mock 30개 거래처 평균값
- overdue_rate: 19.4% (목표 18.6%) — mock 데이터 근사치
- 두 값 모두 실제 데이터 연동 시 자동 수정됨

### Phase 3 — LangGraph Agent 실제 구현 [완료]
- [x] `agent/state.py` — NaraState TypedDict 구현 (alert, gathered_data, root_causes, actions, human_decision)
- [x] `agent/nodes/anomaly_detector.py` — z_score = |change_pct| / 7.0, threshold=2.0
- [x] `agent/nodes/data_gatherer.py` — get_subgraph() + ChromaDB 유사 사례 검색 (fallback: Mock)
- [x] `agent/nodes/root_cause_analyzer.py` — `GEMINI_API_KEY` 있으면 Gemini 2.0 Flash, 없으면 Mock 6개 원인 (depth 1/2/3)
- [x] `agent/nodes/action_recommender.py` — `GEMINI_API_KEY` 있으면 Gemini 2.0 Flash, 없으면 Mock ACT-001/002/003
- [x] `agent/graph.py` — StateGraph + 조건부 엣지 (z_score >= threshold → data_gatherer, else END), 싱글톤 nara_graph
- [x] `api/v1/analyze.py` — LangGraph astream() 실행, 임의 오류 시 기존 Mock SSE fallback으로 동작
- **LLM API 키 없어도 Mock fallback으로 전체 분석 시나리오 작동 확인**

### Phase 4 — Frontend 실제 구현 [완료]
- [x] npm install + next dev 확인 (http://localhost:3000/dashboard)
- [x] `components/KpiCard.tsx` — 값/변화량/트렌드(상승=빨강, 하락=초록) 표시
- [x] `components/SalesChart.tsx` — Recharts LineChart, 7개월 추이, 3월 빨간 점 + "-20%" ReferenceLine
- [x] `components/AlertList.tsx` — /api/v1/alerts 실시간 fetch, 배지 색상 (new=빨강/in_progress=노랑/resolved=초록)
- [x] `components/AnalysisStream.tsx` — EventSource SSE, 노드별 이모지(🔍📊🔬💡), pulse 애니메이션, onCausesReady/onActionsReady 콜백
- [x] `components/CauseTree.tsx` — depth별 색상 (1=빨강, 2=주황, 3=노랑), 들여쓰기 계층
- [x] `components/ActionCard.tsx` — POST /api/v1/actions/{id}/execute, simulated_impact 결과 카드 표시
- [x] `components/KnowledgeGraph.tsx` — SVG 동심원 레이아웃, 폐업 거래처 빨간 점선+✕, 호버 툴팁
- [x] `dashboard/page.tsx` — 3탭(Overview/Knowledge Graph/Root Cause), causes/actions 중앙 상태, Alert 클릭→분석탭 전환
- [x] `.env.local` — NEXT_PUBLIC_API_URL=http://localhost:8000

**프론트엔드 동작 확인:**
```
http://localhost:3000/dashboard
- Overview:       KPI 4개(실시간) + 강남도매 7개월 차트 + Alert 리스트(실시간)
- Knowledge Graph: gangnam-wholesale SVG (11노드, 12엣지, 폐업✕)
- Root Cause:     분석시작 → SSE 4노드 → 원인트리(색상) + 액션카드 3개
```

### Phase 5 — 최종 완성 [완료]
- [x] LLM: Anthropic Claude → **Google Gemini 2.0 Flash** (무료) 전환
  - `requirements.txt`: `langchain-anthropic` 제거, `langchain-google-genai` + `google-generativeai` 추가
  - `root_cause_analyzer.py`, `action_recommender.py`: `ChatGoogleGenerativeAI` + `GEMINI_API_KEY` 사용
- [x] Neo4j Aura Free 실제 연결
  - `neo4j_client.py`: `dotenv` 로드, 전체 try/except fallback 강화, `"source": "neo4j"/"mock"` 응답 필드 추가
  - `api/v1/graph.py`: `GraphResponse`에 `source` 필드 추가
- [x] ChromaDB 벡터 검색 실제 구현
  - `db/chroma_client.py`: PersistentClient, 시드 10건, cosine 유사도 검색
  - `agent/nodes/data_gatherer.py`: `search_similar_cases()` 실제 호출
  - `main.py`: `init_chroma()` lifespan에 추가
- [x] UI 폴리싱 (발표 품질)
  - `layout.tsx`: "삼일회계법인 AX Node" 헤더 추가
  - `dashboard/page.tsx`: 탭 전환 fade 트랜지션
  - `KpiCard.tsx`: 숫자 카운트업 애니메이션 (500ms)
  - `SalesChart.tsx`: Y축 "(만원)" 단위, "거래처 3곳 폐업 ▼" annotation
  - `AnalysisStream.tsx`: 분석 중 경과 시간 카운터, 완료 후 총 소요시간 표시
  - `CauseTree.tsx`: 항목별 순차 fade-in (100ms delay)
  - `ActionCard.tsx`: 신뢰도 프로그레스 바 (80%↑ 초록, 미만 노랑), 실행 중 스피너
  - `KnowledgeGraph.tsx`: 폐업 거래처 "폐업" 라벨, HTML 에러 블록 + 재시도 버튼

**전체 스택 무료 운영:**
- LLM: Google Gemini 2.0 Flash (무료)
- Graph DB: Neo4j Aura Free (무료)
- Vector DB: ChromaDB (로컬 무료)
- ERP Mock: SQLite (로컬 무료)

**환경변수 (`backend/.env`):**
```
GEMINI_API_KEY=...      # Gemini 분석 활성화
NEO4J_URI=...           # 실제 Knowledge Graph 활성화
NEO4J_USER=...
NEO4J_PASSWORD=...
```
환경변수 없으면 모든 기능 Mock fallback으로 작동.

---

## 10. 코딩 컨벤션

- 한국어 주석, 영어 코드
- Python: 타입 힌트 필수, black 포매팅
- TypeScript: strict mode
- 모든 API: /api/v1/ prefix
- 커밋 메시지: 한국어 (예: "feat: KPI 엔드포인트 추가")

---

## 11. 핵심 명심사항

> 이 대시보드는 단순 기술 데모가 아닙니다.
> "데이터가 의사결정을 바꿀 수 있다"는 것을 증명하는 것이 목적입니다.
>
> 제안서의 마지막 메시지:
> "1,955개 와인이 나쁜 와인이 아닙니다. 맞는 고객을 만나지 못했을 뿐입니다.
>  디지털 전환은 1,955개 와인이 제자리에서 문화적 가치를 전달하도록 하는 것입니다."
