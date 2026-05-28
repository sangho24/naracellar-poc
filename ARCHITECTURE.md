# ARCHITECTURE.md — 나라셀라 PoC 상세 설계

> CLAUDE.md의 비즈니스 맥락을 반드시 먼저 읽으세요.
> 이 문서는 4개 모듈의 책임, 데이터 흐름, API 계약을 정의합니다.

---

## 전체 데이터 흐름

```
[사용자 브라우저]
    ↓ (HTTP)
[Next.js Frontend]  ←→  [FastAPI Backend]
                              ↓
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
              [LangGraph]  [Neo4j]  [ChromaDB]
               Agent        Graph    Vector
                    ↓         ↓         ↓
                    └─────────┼─────────┘
                              ↓
                         [SQLite]
                        Mock ERP 데이터
```

---

## Module 1: Frontend (Next.js)

### 책임
- KPI 카드 렌더링
- Alert 리스트 표시
- Agent 분석 결과 SSE 스트리밍 수신 및 단계별 표시
- Knowledge Graph SVG 렌더링
- 액션 추천 카드 + 실행 버튼

### 페이지 구조
```
app/
├── layout.tsx              # 전체 레이아웃 (헤더: "나라셀라 Digital Command Center")
├── dashboard/
│   └── page.tsx            # 메인 대시보드 (탭: Overview / Knowledge Graph / Root Cause 분석)
└── components/
    ├── KpiCard.tsx         # KPI 숫자 카드 (값, 변화량, 트렌드)
    ├── SalesChart.tsx      # Recharts 라인 차트 (7개월 매출 추이)
    ├── AlertList.tsx       # Alert 리스트 (클릭 시 분석 탭 전환)
    ├── AnalysisStream.tsx  # Agent 노드별 단계 표시 (SSE 수신)
    ├── CauseTree.tsx       # Depth 1→2→3 원인 트리
    ├── ActionCard.tsx      # 추천 액션 (설명 + 효과 + 실행 버튼)
    └── KnowledgeGraph.tsx  # SVG 기반 그래프 시각화
```

### 프론트 → 백엔드 호출 패턴
```typescript
// 1. 페이지 로드 시
const kpi = await fetch("http://localhost:8000/api/v1/kpi").then(r => r.json());
const alerts = await fetch("http://localhost:8000/api/v1/alerts").then(r => r.json());

// 2. "분석 시작" 버튼 클릭 시 (SSE 스트리밍)
const evtSource = new EventSource("http://localhost:8000/api/v1/analyze?alert_id=ALT-001");
evtSource.onmessage = (e) => {
  const step = JSON.parse(e.data);
  // step = { node: "data_gatherer", status: "complete", data: {...} }
  // → 해당 노드 UI 업데이트
};

// 3. "실행" 버튼 클릭 시
const result = await fetch("http://localhost:8000/api/v1/actions/ACT-001/execute", {
  method: "POST"
}).then(r => r.json());
```

---

## Module 2: Backend (FastAPI)

### 책임
- 5개 REST 엔드포인트 제공
- LangGraph Agent 실행 및 SSE 스트리밍
- Neo4j / ChromaDB / SQLite 연결 관리

### API 계약

#### `GET /api/v1/kpi`
```json
// Response 200
{
  "inventory_days": 348,
  "inventory_days_change": "+133일 vs 2022",
  "overdue_rate": 18.6,
  "overdue_amount": "25.4억",
  "fx_exposure": 73,
  "fx_impact": "5% 변동시 3.6억",
  "longtail_rate": 12,
  "longtail_change": "-3% vs 전월"
}
```

#### `GET /api/v1/alerts`
```json
// Response 200
[
  {
    "id": "ALT-001",
    "region": "강남",
    "channel": "도매",
    "metric": "매출",
    "change_pct": -20,
    "detected_at": "2025-03-15T09:23:00",
    "status": "new"
  }
]
```

#### `GET /api/v1/analyze?alert_id=ALT-001`
SSE (Server-Sent Events) 스트리밍 응답.
각 Agent 노드 완료 시 이벤트 전송:
```
event: step
data: {"node": "anomaly_detector", "status": "complete", "data": {"z_score": 2.8, "threshold": 2.0, "detail": "강남 도매 채널 매출 전월 대비 20% 하락 확인"}}

event: step
data: {"node": "data_gatherer", "status": "complete", "data": {"neo4j_results": {"accounts": 47, "skus": 312}, "vector_results": [{"case": "2023년 이태원 도매 15% 하락", "similarity": 0.87}]}}

event: step
data: {"node": "root_cause_analyzer", "status": "complete", "data": {"causes": [{"depth": 1, "text": "강남 도매 매출 20% 하락"}, {"depth": 2, "text": "거래처 3곳 폐업"}, {"depth": 2, "text": "프리미엄 와인 수요 급감"}, {"depth": 3, "text": "MZ세대 위스키·무알코올 이탈"}, {"depth": 3, "text": "편의점 채널 성장 → 도매 잠식"}]}}

event: step
data: {"node": "action_recommender", "status": "complete", "data": {"actions": [{"id": "ACT-001", "title": "중저가 칠레 와인 프로모션", "desc": "몬테스 클래식 20% 할인 쿠폰", "impact": "예상 매출 +12%", "confidence": 0.82}]}}

event: done
data: {"message": "분석 완료"}
```

#### `GET /api/v1/graph/{entity_id}`
```json
// GET /api/v1/graph/gangnam-wholesale
// Response 200
{
  "nodes": [
    {"id": "gangnam", "label": "강남 도매", "type": "region"},
    {"id": "rest1", "label": "리스토란테 A", "type": "account", "status": "closed"},
    {"id": "sku1", "label": "몬테스 알파", "type": "sku"},
    {"id": "chile", "label": "칠레", "type": "brand"}
  ],
  "edges": [
    {"from": "gangnam", "to": "rest1", "relation": "SERVES"},
    {"from": "rest1", "to": "sku1", "relation": "ORDERS"},
    {"from": "sku1", "to": "chile", "relation": "ORIGIN"}
  ]
}
```

#### `POST /api/v1/actions/{action_id}/execute`
```json
// POST /api/v1/actions/ACT-001/execute
// Response 200
{
  "action_id": "ACT-001",
  "status": "simulated",
  "simulated_impact": {
    "revenue_change_pct": 12,
    "target_accounts": 44,
    "estimated_cost": "850만원",
    "roi": 3.2
  }
}
```

---

## Module 3: Agent (LangGraph)

### State 정의
```python
from typing import TypedDict, Optional

class NaraState(TypedDict):
    alert: dict              # {"region": "강남", "channel": "도매", "metric": "매출", "change_pct": -20}
    gathered_data: dict      # Neo4j + ChromaDB 수집 결과
    root_causes: list        # [{"depth": 1, "text": "..."}, ...]
    actions: list            # [{"id": "ACT-001", "title": "...", "impact": "...", "confidence": 0.82}]
    human_decision: Optional[str]  # "approve" | "revise" | None
```

### 노드 4개
1. **anomaly_detector**: SQLite에서 최근 KPI 조회 → z-score 계산 → 이상 여부 판단
2. **data_gatherer**: Neo4j Tool (관계 탐색) + ChromaDB Tool (유사 사례 검색) 병렬 호출
3. **root_cause_analyzer**: 수집된 데이터 기반으로 LLM에게 다단계 원인 분석 요청 (depth 1→2→3)
4. **action_recommender**: 원인 + 데이터 기반으로 구체적 액션 생성 (각각 impact, confidence 포함)

### Edge (라우팅)
```
anomaly_detector ──(이상 있음)──→ data_gatherer
anomaly_detector ──(이상 없음)──→ END
data_gatherer ──────────────────→ root_cause_analyzer
root_cause_analyzer ────────────→ action_recommender
action_recommender ─────────────→ human_review (interrupt)
human_review ──(approve)────────→ END
human_review ──(revise)─────────→ root_cause_analyzer (재분석)
```

### Tool 정의
```python
# tools/neo4j_query.py
# Cypher 쿼리로 Neo4j에서 관련 거래처, SKU, 브랜드 관계 탐색
# 입력: region, channel
# 출력: nodes, edges (2-hop)

# tools/vector_search.py
# ChromaDB에서 유사 과거 사례 검색
# 입력: alert 설명 텍스트
# 출력: 유사 사례 리스트 (similarity score 포함)
```

---

## Module 4: Data Layer

### Neo4j (Knowledge Graph)
```
노드:
  (:SKU {id, name, brand, country, price_tier, volume_ml})
  (:Account {id, name, type, region, status, credit_grade})
  (:Channel {id, name})  — 도매, 온라인, 리테일
  (:Brand {id, name, country})
  (:Region {id, name})

관계:
  (:Account)-[:LOCATED_IN]->(:Region)
  (:Account)-[:OPERATES_IN]->(:Channel)
  (:Account)-[:ORDERS]->(:SKU)
  (:SKU)-[:BELONGS_TO]->(:Brand)
  (:Brand)-[:ORIGIN]->(:Region)
```

### ChromaDB (Vector Store)
- sales_history 컬렉션: 과거 월별 매출 변동 사례를 임베딩
- 각 문서: "2023년 10월 이태원 도매 15% 하락 — 원인: 할로윈 사고 이후 유동인구 감소"

### SQLite (Mock ERP)
- sales 테이블: sku_id, account_id, channel, month, quantity, revenue
- inventory 테이블: sku_id, current_stock, days_held, last_inbound
- accounts 테이블: id, name, type, region, credit_grade, overdue_amount

---

## Mock 데이터 설계 원칙

1. **SKU 50개** (1,955개 중 대표 선별: 미국 21, 프랑스 9, 칠레 8, 기타 12)
2. **거래처 30개** (570개 중 대표: 강남 10, 홍대 8, 부산 7, 기타 5)
3. **채널 3개**: 도매, 온라인, 리테일
4. **기간**: 2024.09 ~ 2025.03 (7개월)
5. **핵심**: 강남 도매 3월 매출이 자연스럽게 20% 하락하도록 데이터 설계
6. **폐업 거래처**: 강남 레스토랑 2곳, 와인바 1곳에 status="closed" + 3월 매출=0

---

## PoC 단계별 구현 순서

### Phase 0: 셋업
- [ ] CLAUDE.md, ARCHITECTURE.md 작성
- [ ] frontend/ Next.js 프로젝트 생성
- [ ] backend/ FastAPI 프로젝트 생성
- [ ] mock_data/ CSV 파일 생성

### Phase 1: Knowledge Graph
- [ ] Neo4j Aura 인스턴스 생성
- [ ] neo4j_seed.cypher로 노드/관계 생성
- [ ] GET /api/v1/graph 엔드포인트 구현

### Phase 2: Backend API
- [ ] GET /api/v1/kpi (SQLite 조회)
- [ ] GET /api/v1/alerts (이상 감지 목록)
- [ ] POST /api/v1/analyze (SSE 스트리밍)
- [ ] POST /api/v1/actions/{id}/execute

### Phase 3: LangGraph Agent
- [ ] NaraState 정의
- [ ] anomaly_detector 노드
- [ ] data_gatherer 노드 (Neo4j Tool + ChromaDB Tool)
- [ ] root_cause_analyzer 노드
- [ ] action_recommender 노드
- [ ] 그래프 워크플로우 연결

### Phase 4: Frontend
- [ ] KpiCard 컴포넌트
- [ ] SalesChart 컴포넌트
- [ ] AlertList 컴포넌트
- [ ] AnalysisStream 컴포넌트 (SSE 수신)
- [ ] KnowledgeGraph 컴포넌트
- [ ] ActionCard 컴포넌트
- [ ] 대시보드 페이지 레이아웃 (3탭)

### Phase 5: 통합 + 데모
- [ ] Frontend ↔ Backend 연결
- [ ] "강남 도매 -20%" 시나리오 end-to-end 테스트
- [ ] 에러 디버깅
- [ ] 데모 시나리오 스크립트 정리
