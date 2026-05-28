# 나라셀라 PoC 구현 현황

최종 업데이트: 2026-03-16
구현 완료 단계: Phase 0 ~ Phase 5 (전체 완료)

---

## 1. 프로젝트 개요

나라셀라(와인 수입 유통사)의 영업 데이터를 시각화하고, 이상 감지 시 AI Agent가 원인을 분석하여 액션을 추천하는 대시보드 PoC.

핵심 시나리오: **"강남 도매 채널 매출 전월 대비 -20% 하락"** 을 자동으로 감지하고, Agent가 단계별로 원인을 분석하여 추천 액션 3개를 제시한다.

---

## 2. 기술 스택

### Backend
| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 웹 프레임워크 | FastAPI | 0.111.0 | REST API 서버 |
| ASGI 서버 | Uvicorn | 0.30.1 | FastAPI 실행 |
| 데이터 검증 | Pydantic V2 | ≥2.7.4 | Request/Response 스키마 |
| 실시간 스트리밍 | sse-starlette | 2.1.0 | SSE(Server-Sent Events) |
| 로컬 DB | SQLite3 | 내장 | Mock ERP 데이터 저장 |
| 그래프 DB | Neo4j | 5.21.0 | Knowledge Graph (`NEO4J_URI` 없으면 Mock) |
| 벡터 DB | ChromaDB | 0.5.3 | 유사 사례 검색 (로컬 persist) |
| Agent 워크플로우 | LangGraph | 0.1.19 | StateGraph + 조건부 엣지 |
| LLM 연동 | langchain-google-genai | 1.0.7 | Gemini 2.0 Flash 호출 |
| LLM SDK | google-generativeai | 0.7.2 | langchain-google-genai 의존성 |
| 환경변수 | python-dotenv | 1.0.1 | .env 파일 로드 |
| 런타임 | Python | 3.11+ | 전체 백엔드 |

> **Python 3.14 호환:** pydantic 버전을 `>=2.7.4`로 완화 (3.14용 사전 빌드 wheel 없이 소스 컴파일 불필요)

### Frontend
| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | Next.js | 14.2.0 | App Router 방식 |
| 언어 | TypeScript | 5+ | strict 모드 |
| 스타일링 | Tailwind CSS | 3.3+ | 유틸리티 CSS |
| 차트 | Recharts | 2.12.0 | 매출 추이 라인 차트 |
| 그래프 시각화 | SVG (직접 구현) | — | Knowledge Graph 렌더링 |
| 실시간 수신 | EventSource (브라우저 내장) | — | SSE 스트림 수신 |

### 전체 스택 무료 운영
| 항목 | 기술 | 비고 |
|------|------|------|
| LLM | Google Gemini 2.0 Flash | 무료, `GEMINI_API_KEY` |
| Graph DB | Neo4j Aura Free | 무료, `NEO4J_URI` |
| Vector DB | ChromaDB | 로컬 무료, `backend/chroma_db/` |
| ERP Mock | SQLite | 로컬 무료 |

### Mock fallback 정책

환경변수 없이도 전체 시나리오가 작동하도록 모든 외부 서비스에 Mock fallback 구현.

| 환경변수 | 없을 때 | 있을 때 |
|---------|---------|---------|
| `NEO4J_URI` | Mock 그래프 데이터 (11노드 12엣지) | 실제 Neo4j 2-hop Cypher 쿼리 |
| `GEMINI_API_KEY` | Mock 원인 트리 + Mock 액션 | Gemini 2.0 Flash 실제 분석 |
| ChromaDB | Mock 유사 사례 3건 | ChromaDB 로컬 cosine 검색 |

---

## 3. 프로젝트 구조

```
narasellar-poc/
├── backend/
│   ├── main.py                        # FastAPI 앱 진입점, lifespan, CORS
│   ├── .env                           # API 키 및 DB 연결 정보 (gitignore)
│   ├── api/
│   │   └── v1/
│   │       ├── kpi.py                 # GET /api/v1/kpi
│   │       ├── alerts.py              # GET /api/v1/alerts
│   │       ├── analyze.py             # GET /api/v1/analyze (SSE)
│   │       ├── graph.py               # GET /api/v1/graph/{entity_id}
│   │       └── actions.py             # POST /api/v1/actions/{id}/execute
│   ├── db/
│   │   ├── sqlite_client.py           # SQLite 연결, 초기화, 쿼리
│   │   ├── neo4j_client.py            # Neo4j 2-hop 쿼리 + Mock fallback + source 필드
│   │   └── chroma_client.py           # ChromaDB PersistentClient + cosine 검색
│   ├── agent/
│   │   ├── state.py                   # NaraState TypedDict
│   │   ├── graph.py                   # LangGraph StateGraph 워크플로우
│   │   └── nodes/
│   │       ├── anomaly_detector.py    # z-score 계산
│   │       ├── data_gatherer.py       # Neo4j + ChromaDB 조회
│   │       ├── root_cause_analyzer.py # Gemini 원인 분석 + Mock fallback
│   │       └── action_recommender.py  # Gemini 액션 추천 + Mock fallback
│   ├── chroma_db/                     # ChromaDB 로컬 persist 디렉토리 (자동 생성)
│   └── mock_data/
│       ├── sales.csv                  # 거래처별 월별 매출 (7개월)
│       ├── inventory.csv              # SKU별 재고 정보
│       ├── accounts.csv               # 거래처 정보 (폐업 상태 포함)
│       ├── neo4j_seed.cypher          # Neo4j 초기화 Cypher 스크립트
│       └── narasellar.db              # 서버 기동 시 자동 생성되는 SQLite 파일
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                 # 전체 레이아웃, 헤더 ("삼일회계법인 AX Node")
│   │   ├── page.tsx                   # 루트 → /dashboard 리다이렉트
│   │   ├── dashboard/
│   │   │   └── page.tsx               # 메인 대시보드 (3탭 구조)
│   │   └── components/
│   │       ├── KpiCard.tsx            # KPI 수치 카드 + 카운트업 애니메이션
│   │       ├── SalesChart.tsx         # Recharts 라인 차트
│   │       ├── AlertList.tsx          # 이상 감지 Alert 목록
│   │       ├── AnalysisStream.tsx     # SSE 수신 + 노드 진행 + 소요시간
│   │       ├── CauseTree.tsx          # 원인 계층 트리 + fade-in
│   │       ├── ActionCard.tsx         # 추천 액션 카드 + 신뢰도 바
│   │       └── KnowledgeGraph.tsx     # SVG 그래프 시각화
│   ├── .env.local                     # NEXT_PUBLIC_API_URL=http://localhost:8000
│   └── next.config.mjs
├── CLAUDE.md
├── ARCHITECTURE.md
├── IMPLEMENTATION.md                  # 이 파일
└── FEEDBACK.md                        # 개선사항 메모
```

---

## 4. 백엔드 상세 구현

### 4-1. 서버 기동 (`main.py`)

- `@asynccontextmanager lifespan`: 서버 시작 시 `init_db()` → `init_chroma()` 순서로 자동 호출
- CORS 미들웨어: `allow_origins=["*"]`, `allow_credentials=False` (개발 환경 전용)
- 5개 라우터를 `/api/v1` prefix로 등록

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()      # CSV → SQLite 적재
    init_chroma()  # ChromaDB 컬렉션 초기화 + 시드 10건
    yield
```

### 4-2. SQLite 데이터 레이어 (`db/sqlite_client.py`)

**테이블 3개:**

| 테이블 | 컬럼 | 행 수 |
|--------|------|-------|
| `accounts` | id, name, type, region, credit_grade, overdue_amount, status | 30 |
| `inventory` | sku_id, name, brand, country, price_tier, volume_ml, current_stock, days_held, last_inbound | 50 |
| `sales` | id, sku_id, account_id, channel, month, quantity, revenue | ~224 |

**초기화 방식:** 서버 기동마다 `DELETE` + `INSERT` (멱등성 보장)

**주요 쿼리 함수:**
```python
get_kpi_metrics()           # AVG(days_held), SUM(overdue_amount)/매출, 소진율
get_monthly_sales_by_channel()  # region × channel × month 집계
get_sales_trend(region, channel)  # 특정 지역/채널 7개월 시계열
```

### 4-3. Mock 데이터 설계 (`mock_data/`)

| 지역/채널 | 2025-02 | 2025-03 | 변화율 | Alert |
|-----------|---------|---------|--------|-------|
| 강남/도매 | 40,000,000원 | 32,000,000원 | -20.0% | ALT-001 |
| 홍대/리테일 | 20,000,000원 | 17,000,000원 | -15.0% | ALT-002 |
| 부산/온라인 | ~30,000,000원 | ~31,500,000원 | +5.0% | 없음 |

**강남/도매 -20% 달성 방식:**
- 폐업 거래처 3곳(rest1, rest2, wine1): 2월 8,000,000원 → 3월 0원
- 잔존 거래처 7곳: 32,000,000원 유지

### 4-4. API 엔드포인트 상세

#### `GET /api/v1/kpi`

```json
{
  "inventory_days": 362,
  "inventory_days_change": "+147일 vs 2022",
  "overdue_rate": 19.4,
  "overdue_amount": "0.2억",
  "fx_exposure": 73,
  "fx_impact": "5% 변동시 3.6억",
  "longtail_rate": 13.2,
  "longtail_change": "+0.0% vs 전월",
  "sales_trend": [{"month": "2024-09", "revenue": 37800000}, ...]
}
```

계산 공식:
- `inventory_days` = `AVG(days_held)`
- `overdue_rate` = `SUM(overdue_amount)` / 마지막 월 총매출 × 100
- `longtail_rate` = 마지막 월 판매 SKU 수 / 전체 SKU 수 × 100
- `fx_exposure` = 73 (하드코딩)

#### `GET /api/v1/alerts`

전월 대비 -15% 이하 지역/채널 자동 감지, 심각한 순 정렬.

```json
[
  {"id": "ALT-001", "region": "강남", "channel": "도매",
   "change_pct": -20.0, "status": "new"},
  {"id": "ALT-002", "region": "홍대", "channel": "리테일",
   "change_pct": -15.0, "status": "new"}
]
```

#### `GET /api/v1/analyze?alert_id=ALT-001`

SSE 스트리밍. LangGraph `astream()` 시도 → 실패 시 Mock fallback.

```
event: step  data: {"node": "anomaly_detector",     "status": "complete", "data": {...}}
event: step  data: {"node": "data_gatherer",         "status": "complete", "data": {...}}
event: step  data: {"node": "root_cause_analyzer",   "status": "complete", "data": {"causes": [...]}}
event: step  data: {"node": "action_recommender",    "status": "complete", "data": {"actions": [...]}}
event: done  data: {"message": "분석 완료"}
```

Mock fallback 지연: `[1.2, 1.8, 2.0, 1.5]` 초

#### `GET /api/v1/graph/{entity_id}`

`get_subgraph(entity_id)` 호출. 응답에 `source` 필드 포함.

```json
{
  "source": "neo4j",
  "nodes": [
    {"id": "gangnam", "label": "강남 도매", "type": "region"},
    {"id": "rest1",   "label": "리스토란테 A", "type": "account", "status": "closed"}
  ],
  "edges": [{"from": "gangnam", "to": "rest1", "relation": "SERVES"}]
}
```

`source`: `"neo4j"` = 실제 DB 조회, `"mock"` = fallback

#### `POST /api/v1/actions/{action_id}/execute`

| action_id | revenue_change_pct | roi |
|-----------|-------------------|-----|
| ACT-001 | +12.0% | 3.2 |
| ACT-002 | +5.5% | 1.8 |
| ACT-003 | +3.0% | 5.1 |

---

## 5. Neo4j Knowledge Graph

### 시드 스크립트 (`mock_data/neo4j_seed.cypher`)

`MERGE` 구문으로 멱등성 보장.

| 레이블 | 수 | 주요 속성 |
|--------|-----|----------|
| Brand | 10 | id, name, country |
| Region | 3 | 강남/홍대/부산 |
| Channel | 3 | 도매/리테일/온라인 |
| SKU | 7 | id, name, price_tier, volume_ml |
| Account | 8 | id, name, status(active/closed) |

관계 타입: `LOCATED_IN`, `OPERATES_IN`, `ORDERS`, `BELONGS_TO`, `ORIGIN`

### `db/neo4j_client.py`

- `try/except ImportError` 로 `dotenv` 선택적 로드 (미설치 환경 대응)
- `NEO4J_URI` 없으면 즉시 Mock 반환
- 실제 쿼리 전체를 `try/except` 로 감싸 연결 실패 시 Mock fallback
- 반환값에 `"source": "neo4j"` 또는 `"source": "mock"` 포함

```python
MATCH (start {id: $entity_id})-[r1]-(mid)-[r2]-(end)
RETURN start, r1, mid, r2, end LIMIT 100
```

---

## 6. ChromaDB 벡터 검색

### `db/chroma_client.py`

```python
def init_chroma():
    client = chromadb.PersistentClient(path="./chroma_db")
    _collection = client.get_or_create_collection("sales_cases", metadata={"hnsw:space": "cosine"})
    if _collection.count() == 0:
        _collection.add(documents=_SEED_DOCUMENTS, ids=[...])  # 10건 시드

def search_similar_cases(query: str, n_results: int = 3) -> list:
    results = _collection.query(query_texts=[query], n_results=n_results)
    # cosine distance → similarity: 1 - distance
    return [{"case": doc, "similarity": round(1 - dist, 2)} for doc, dist in zip(...)]
```

`init_chroma()` 또는 `search_similar_cases()` 실패 시 Mock 3건 반환.

---

## 7. LangGraph Agent

### 상태 (`agent/state.py`)

```python
class NaraState(TypedDict):
    alert: dict          # {"id", "region", "channel", "change_pct", "z_score", "threshold", "detail"}
    gathered_data: dict  # {"neo4j_results": {...}, "vector_results": [...]}
    root_causes: list    # [{"depth": 1|2|3, "text": "..."}]
    actions: list        # [{"id", "title", "desc", "impact", "confidence"}]
    human_decision: Optional[str]
```

### 워크플로우 (`agent/graph.py`)

```
anomaly_detector
    ├── z_score >= 2.0 → data_gatherer → root_cause_analyzer → action_recommender → END
    └── z_score < 2.0  → END
```

싱글톤: `nara_graph = build_graph()` — 서버 기동 시 1회 빌드

### 노드별 구현

| 노드 | 입력 | 출력 | LLM |
|------|------|------|-----|
| `anomaly_detector` | `alert.change_pct` | z_score = \|change_pct\| / 7.0 | 없음 |
| `data_gatherer` | alert | neo4j_results + vector_results | 없음 |
| `root_cause_analyzer` | gathered_data | root_causes (depth 1/2/3) | Gemini 2.0 Flash |
| `action_recommender` | root_causes | actions (ACT-001~003) | Gemini 2.0 Flash |

**LLM 연동 패턴 (root_cause_analyzer, action_recommender 공통):**
```python
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    state["root_causes"] = _MOCK_CAUSES
    return state

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key)
response = llm.invoke([HumanMessage(content=prompt)])
raw = response.content.strip()
# ```json ... ``` 코드블록 strip 후 json.loads()
# 파싱 실패 시 except → Mock fallback
```

---

## 8. 프론트엔드 상세 구현

### 페이지 구조

`/dashboard` 단일 페이지, 탭 3개, `transition-opacity duration-300` fade 전환.

| 탭 | 컴포넌트 |
|----|---------|
| Overview | KpiCard×4, SalesChart, AlertList |
| Knowledge Graph | KnowledgeGraph (전체) |
| Root Cause 분석 | AnalysisStream + CauseTree (좌) / KnowledgeGraph compact + ActionCard×N (우) |

Alert 클릭 → `selectedAlertId` 업데이트 → Root Cause 탭 자동 전환.

### 컴포넌트별 구현

#### `KpiCard.tsx`
- `requestAnimationFrame` 기반 ease-out 500ms 카운트업 (`0 → 목표값`)
- `parseValue()`: `"348일"` → `{num: 348, suffix: "일"}` 분리
- trend 색상: `up` → 빨강, `down` → 초록, `neutral` → 노랑

#### `SalesChart.tsx`
- API `sales_trend` 사용, 없으면 하드코딩 7개월 fallback
- 변환: `"2024-09"` → `"24.09"`, revenue 원 → 만원
- YAxis `width={50}`, 단위 `(단위: 만원)` 차트 위 별도 텍스트로 표시
- `ReferenceLine x="25.03"` — 빨간 점선 (텍스트 라벨 없음)
- 2025-03 데이터 포인트: `r=6` 빨간 원, 나머지: `r=4` 파란 원

#### `AlertList.tsx`
- `AbortController` + 5초 timeout, `retryCount` 상태로 재시도

#### `AnalysisStream.tsx`
- `EventSource` SSE, `step`/`done` 이벤트 처리
- 분석 중 경과 시간 1초 interval 표시
- 완료 후 `"✓ 분석 완료 (총 X.Xs)"` 표시
- 노드 아이콘: 🔍 / 📊 / 🔬 / 💡

#### `CauseTree.tsx`
- depth 1 → `text-red-400 font-semibold` + `■`
- depth 2 → `text-orange-400 ml-4` + `▸`
- depth 3 → `text-yellow-400 ml-8 text-sm` + `·`
- 각 항목 `index * 100ms` delay 순차 fade-in

#### `ActionCard.tsx`
- `POST /api/v1/actions/{id}/execute` 호출
- 신뢰도 프로그레스 바: ≥0.8 초록, <0.8 노랑
- 실행 중 스피너, 결과 인라인 표시

#### `KnowledgeGraph.tsx`
- `AbortController` + **12초** timeout (Neo4j 연결 지연 대응)
- viewBox: `600 × 600` (전체 모드), `600 × 220` (compact 모드)
- scale: `0.9` (전체) / `0.55` (compact) — 모든 노드가 viewBox 안에 들어오도록 조정
- 동심원 반경: account `120×scale`, sku `200×scale`, brand `270×scale`
- 폐업 노드: 빨간 점선 외부링 + `✕` + `"폐업"` 라벨
- 엣지 라벨: 반투명 검정 배경 rect(`fillOpacity=0.85`) + 텍스트로 노드와 겹침 방지
- 툴팁: 라벨 길이 기반 동적 너비, 상단 노드는 아래 표시, 좌우 경계 클램핑

```
region   → 중심점 (cx, cy)
account  → r = 108 (120 × 0.9)
sku      → r = 180 (200 × 0.9)
brand    → r = 243 (270 × 0.9)
```

### Long Tail 소진율 트렌드 계산

```typescript
// longtail_change 값 ("+ 0.0% vs 전월" 등)으로 동적 결정
trend = c.startsWith("+0.0") ? "neutral" : c.startsWith("+") ? "down" : "up"
// "down" = 초록(개선), "up" = 빨강(악화), "neutral" = 노랑(변화없음)
```

---

## 9. API 호출 흐름

```
브라우저 로드
  ├─ GET /api/v1/kpi    → KpiCard 4개 + SalesChart
  └─ GET /api/v1/alerts → AlertList

Alert 클릭 → Root Cause 탭 전환
  └─ GET /api/v1/graph/gangnam-wholesale → KnowledgeGraph

"분석 시작" 클릭
  └─ EventSource → GET /api/v1/analyze?alert_id=ALT-001
       ├─ LangGraph astream() 시도
       │    ├─ anomaly_detector  (z_score 계산)
       │    ├─ data_gatherer     (Neo4j + ChromaDB)
       │    ├─ root_cause_analyzer (Gemini → JSON 파싱)
       │    └─ action_recommender  (Gemini → JSON 파싱)
       ├─ 실패 시 Mock SSE fallback (1.2/1.8/2.0/1.5초 지연)
       ├─ step(root_cause_analyzer) → CauseTree 렌더링
       ├─ step(action_recommender)  → ActionCard 3개 렌더링
       └─ done → EventSource.close()

"실행" 클릭 (ACT-001)
  └─ POST /api/v1/actions/ACT-001/execute → simulated_impact 카드
```

---

## 10. 실행 방법

### 백엔드
```bash
cd backend
# 새 패키지만 설치 (pydantic은 이미 설치된 버전 유지)
pip install python-dotenv langchain-google-genai==1.0.7 google-generativeai==0.7.2
# 또는 전체 설치
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev  # → http://localhost:3000/dashboard
```

### 환경 변수

**`backend/.env`:**
```
GEMINI_API_KEY=...         # Gemini 분석 활성화 (없으면 Mock)
NEO4J_URI=neo4j+s://...    # 실제 Knowledge Graph 활성화 (없으면 Mock)
NEO4J_USER=...
NEO4J_PASSWORD=...
```

**`frontend/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Neo4j 시드 데이터 (최초 1회)
```
Neo4j Aura 콘솔 → Query 탭에서
backend/mock_data/neo4j_seed.cypher 내용 붙여넣기 실행
```

---

## 11. 알려진 한계

| 항목 | 현재 상태 | 비고 |
|------|-----------|------|
| KPI Mock 수치 | inventory_days=362 (목표 348), overdue_rate=19.4% (목표 18.6%) | Mock 30개 거래처 평균, 실데이터 연동 시 자동 수정 |
| overdue_amount | 0.2억 (목표 25.4억) | Mock 30개 vs 실제 570개 |
| ChromaDB 검색 | 텍스트 기반 cosine (임베딩 없음) | 실제 임베딩 모델 연동 시 정확도 향상 |
| human_review | `NaraState.human_decision` 필드만 존재 | LangGraph interrupt 미구현 |
| `agent/tools/` | stub 파일 존재 | 각 노드에서 직접 client 호출 중 |
