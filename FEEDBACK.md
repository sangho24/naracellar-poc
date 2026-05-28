# 개선 사항 메모

> 발견한 버그, UI 불편함, 기능 개선 아이디어를 자유롭게 적어두는 파일입니다.
> Claude Code에게 "FEEDBACK.md 보고 수정해줘" 라고 하면 반영합니다.
---

## 버그
<!-- 예시:
- [ ] KPI 카드 로딩 중 레이아웃 깨짐
- [ ] Alert 클릭 시 가끔 탭 전환 안 됨
-->

---

## UI / UX

<!-- 예시:
- [ ] 차트 Y축 숫자가 너무 빽빽함
- [ ] 모바일에서 카드 레이아웃 깨짐
-->

---

## 기능 추가

<!-- 예시:
- [ ] Alert 필터링 (지역별, 채널별)
- [ ] 분석 결과 PDF 다운로드
-->

---

## 데이터 / 백엔드

<!-- 예시:
- [ ] KPI 수치가 목표값과 다름 (362일 → 348일)
- [ ] Neo4j 그래프 노드가 너무 적음
-->

---

## 완료

- [x] KG "요청 시간 초과" → timeout 5초→12초 증가
- [x] SalesChart "거래처 3곳 폐업" annotation 오른쪽 잘림 → position `top` → `insideTopLeft`
- [x] SalesChart "(만원)" Y축 눈금 겹침 → YAxis label 제거, 차트 우상단에 별도 텍스트로 이동
- [x] KG 엣지 글씨 노드 겹침 → 엣지 라벨 배경 rect 추가 (반투명 검정)
- [x] SalesChart "거래처 3곳 폐업" annotation 잘림 → top margin 8→36px 증가
- [x] Long Tail 소진율 트렌드 하드코딩 → longtail_change 값 기반 동적 계산 (+0.0% = neutral)
- [x] Knowledge Graph 그래프 잘림 → viewBox height 420→600, scale 조정으로 전체 노드 표시
- [x] Knowledge Graph 호버 툴팁 → 라벨 길이에 맞게 너비 동적 계산, 상단 노드는 아래쪽에 표시

