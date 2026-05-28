# 매니저 미팅 산출물 — Handoff

> 작성: 삼일회계법인 AX Node (엄상호) / 2026-05-27
> 다음 step: 매니저 미팅 잡고, 30분 안에 통화 또는 대면.

---

## 1. 5개 산출물 (절대 경로)

| # | 산출물 | 경로 |
|---|--------|------|
| 1 | Deck PPTX (3장, 컨텐츠 위주) | `C:\Users\seum004\Desktop\인턴 교육\narasellar-poc\output\manager_review_deck.pptx` |
| 1b | Deck 컨텐츠 명세 (디자인 입힐 참조용) | `C:\Users\seum004\Desktop\인턴 교육\narasellar-poc\output\manager_review_deck_content.md` |
| 2 | POC 1-pager (PDF) | `C:\Users\seum004\Desktop\인턴 교육\narasellar-poc\output\poc_sku_analysis.pdf` |
| 3 | POC 방법론 메모 (Markdown) | `C:\Users\seum004\Desktop\인턴 교육\narasellar-poc\output\poc_methodology.md` |
| 4 | 사내 정보 메모 (Markdown) | `C:\Users\seum004\Desktop\인턴 교육\narasellar-poc\output\internal_intel_memo.md` |
| 5 | 매니저 미팅 talking script (Markdown) | `C:\Users\seum004\Desktop\인턴 교육\narasellar-poc\output\manager_meeting_script.md` |

### 보조 자산
- `scraped_wines.csv` / `scraped_wines.json` — 740 SKU 원천 데이터
- `poc_risk_top50.json` / `poc_opportunity_top50.json` — 위험/기회 SKU 상세 리스트
- `_intel_buyer_raw.md` / `_intel_external_raw.md` — Buyer mapping & 외부 정황 raw (4번 메모의 소스)

---

## 2. 미팅 전 사용자가 직접 채워야 할 Placeholder

> 산출물 4 (사내 정보 메모) A 섹션. 미팅 30분 전까지 사내 시스템에서 확인 필요.

- [ ] Relationship owner (사내 4~5월 등록 신청자)
- [ ] 제휴 목적 (감사 / 자문 / 협찬 / 교육 / 기타)
- [ ] 제휴 등급/티어
- [ ] 나라셀라 측 counterparty (이름·직책)
- [ ] 정확한 등록 일자 (4월 vs 5월)
- [ ] 현재 진행 중인 engagement 여부
- [ ] AX Node 외 다른 본부의 history

> **추가 확인 권고**: DART 사업보고서 (accptno **20250318001291**) "임원의 현황" 섹션에서 CFO·IR·물류·IT 책임자 이름 확보.

---

## 3. 의도적으로 남긴 Open Question (매니저 자문 받을 5개)

> 산출물 5 (talking script) Q1~Q5와 일치. 미팅 핵심 자문 주제.

| # | 카테고리 | 질문 |
|---|---------|------|
| Q1 | Sponsorship 전략 | 매니저님 끼고 다시 띄우는 게 맞는가, 다른 파트너 라인도 같이 봐야 하는가? |
| Q2 | Deck reframing | As-Is를 매출 → cash flow로 옮긴 게 맞는 선택인가? |
| Q3 | POC 정확도 | 외부 데이터만으로 이만큼 — client 앞에 sellable한 수준인가? 더 올려야 하나? |
| Q4 | 제휴 owner 접근 | 직접 사내 alliance DB vs 매니저 소개 vs audit 라인 묶기? |
| Q5 | 다음 액션 우선순위 | (a) 회장 직접 후크 / (b) 제휴 owner 정렬 / (c) deck client-grade 폴리시 / (d) POC 정확도 / (e) 기타? |

### 추가 Open Question (각 산출물에 명시)
- Slide 1: 재고/부채 수치 신뢰성 — 사내 다른 본부에서 받을 수 있나
- Slide 2: Phase 1 6개월 → 5개월 가속 가능한가
- Slide 3: 절감 추정치 conservativeness — 너무 보수적인가, 적정인가
- Intel B: 후크 메시지 A안(재고) vs B안(재무 출신) vs C안(비전) 중 어느 게 first hit?
- Intel C: annual 영업손실 34억 vs 분기 2.3억 정합성 — annual 단위로 어떻게 reframe?

---

## 4. 주요 발견 (이번 작업에서 새로 확보한 사실)

### 수치·구조 정정
- **종목코드**: 282240 → **405920** (DART/KRX 기준)
- **annual 영업손실**: 34억 (2024) — deck의 2.3억은 3Q 분기치
- **시총**: 1,288억 → 310억 (-76%), IPO 공모가 -87%
- **SKU 정비 중**: 1,955 → 1,613 → 740 (active in wine_list.php)

### 핵심 인사이트 (실데이터 기반)
- **프랑스 SKU 38% / 매출 23% = +15%p gap** — 가장 큰 Long Tail 위험
- **이탈리아 SKU 15% / 매출 7% = +8%p gap** — 두 번째 위험
- **미국·칠레는 SKU 대비 매출이 큼** (각 -11%p, -8%p) — under-curated
- **카테고리 분포는 시장과 거의 일치** (레드 50% vs 시장 51%) — 진짜 문제는 *국가별 mismatch*
- **어워드·평점 데이터 보유 SKU = 40%** — 60%는 시장 검증 신호 부재

### Buyer 정보
- **1순위 buyer = 마승철 회장** (디아지오 CFO 출신, "발주 예산제·재고 선순환·판관비 개선" 본인 발언)
- 1KMWINE 자체 IT 실패 + 도심 물류센터 무기한 보류 → **외부 파트너 수용 명분 강함**

### 경쟁사 시그널
- **아영FBC만 영업익 +40%** (직영매장·고마진 집중) — 우리 처방의 다른 방식 증거
- 신세계L&B 영업손실 52억 적자전환, 금양인터내셔날 -82.5%

### 글로벌 트렌드 정합성
- 2026 글로벌 와인 디지털 트렌드 핵심 3개 (AI 마케팅·1차 데이터·하이퍼 개인화)와 **우리 PoC가 정확히 일치**

---

## 5. 톤 일관성 체크

5개 산출물 모두 다음 원칙으로 작성:
- ✅ Over-polish 금지 — 단정 결론 피하고 일부는 의도적 open question
- ✅ 모든 숫자/주장에 출처 또는 가정 명시
- ✅ 한국어 비즈니스 톤 (격식체와 구어체 중간)
- ✅ 사용자에게 확인 질문 없음 — 가정 명시 후 자율 진행
- ✅ 70% 완성 + 30% 매니저가 채울 여지

---

## 6. 다음 step 후보 (사용자 결정 사항)

매니저 미팅 후 진도가 어떻게 나갈지에 따라:

**Option A — 제휴 owner 정렬 우선** *(가장 안전)*
- 1주: owner 확인 + 인사 미팅
- 2~3주: owner와 함께 client-facing deck 격상 → 회장 path

**Option B — Deck 폴리시 우선**
- 1주: 매니저 자문 반영 deck v2
- 2주: POC 1장도 client-grade
- 그 후 owner 접근

**Option C — 빠르게 회장 직접 후크** *(가장 빠르지만 정치적 risk 큼)*
- 1주: 매니저 라인으로 후크 1줄 전달

> talking script Q5에서 매니저 답 받고 결정.
