# 프론트엔드 디자인 피드백 — 2026-03-18

> 디자이너 시각 정리 → 15년차 프론트 개발자 관점 구현 사항

---

## 1. 현재 문제 진단

### [크리티컬] Knowledge Graph 로딩 오류
- **원인**: KG 컴포넌트가 페이지 마운트 시 즉시 fetch를 실행함 (탭 활성화 여부 무관)
- `hidden opacity-0` 클래스가 있어도 컴포넌트는 이미 마운트됨 → 백엔드 응답이 느리면 12초 타임아웃 후 오류 표시
- Root Cause 탭의 compact KG도 동일 문제 (페이지 로드 시 2개 fetch 동시 발생)
- **Fix**: `visitedTabs` Set으로 lazy-mount — 탭을 실제 방문할 때만 컴포넌트 렌더링 시작

### [중요] 한글 폰트 미지정
- 현재 폰트 지정 없음 → 시스템 기본 폰트 (Malgun Gothic 등) 렌더링
- 발표 환경에 따라 폰트가 들쭉날쭉하게 보일 수 있음
- **Fix**: `next/font/google`로 Noto Sans KR 로드 (Next.js가 빌드 시 로컬 캐시)

### [개선] 전반적 색상 팔레트 — gray보다 zinc 계열이 더 중립적이고 세련됨
- `gray-950 / gray-900 / gray-800` → `zinc-950 / zinc-900 / zinc-800`
- zinc는 청색 편향이 없어 다크 UI에서 더 자연스럽게 보임

### [개선] 카드 디자인
- 배경 색과 카드 배경 대비가 너무 낮음 (gray-950 vs gray-900)
- 테두리 색도 거의 안 보임
- **Fix**: 카드에 `ring-1 ring-white/5` 또는 더 명확한 border 적용

### [개선] 헤더
- 단순 텍스트 나열 → 좌측 로고 영역과 우측 배지를 더 명확히 구분

### [개선] 탭 네비게이션
- 현재 탭은 `border-b-2` 언더라인 방식인데 괜찮으나, 활성 탭 배경색 없어 어두운 화면에서 약함
- **Fix**: 활성 탭에 `bg-zinc-800` 필 + rounded pill 스타일 적용

### [개선] KPI 카드 아이콘 부재
- 숫자만 있어 빠른 시각 스캔 어려움
- **Fix**: 각 KPI에 간단한 이모지 또는 SVG 아이콘 추가

### [개선] 섹션 제목 스타일
- `uppercase tracking-wider text-xs text-gray-400` — 괜찮지만 구분선 없어 섹션 경계 불명확
- **Fix**: 좌측 colored accent bar (`border-l-2 border-blue-500`) 추가

---

## 2. 구현 체크리스트

- [ ] `layout.tsx`: Noto Sans KR 폰트 적용, 헤더 polish
- [ ] `globals.css`: CSS 변수, 기본 폰트 패밀리
- [ ] `tailwind.config.ts`: fontFamily 확장
- [ ] `dashboard/page.tsx`: lazy-mount KG (visitedTabs), 탭 pill 스타일, 섹션 헤더 개선
- [ ] `KpiCard.tsx`: 아이콘 추가, zinc 팔레트
- [ ] `SalesChart.tsx`: annotation 텍스트 폰트 반영
- [ ] `KnowledgeGraph.tsx`: 오류 UX 개선, 로딩 스켈레톤
- [ ] `AlertList.tsx`: 리스트 아이템 hover 개선
- [ ] `AnalysisStream.tsx`: 스텝 UI 개선
- [ ] `CauseTree.tsx`: 들여쓰기 시각화 개선
- [ ] `ActionCard.tsx`: 카드 레이아웃 polish

---

## 3. 디자인 토큰 (구현 기준)

```
배경:       #09090b  (zinc-950)
카드:       #18181b  (zinc-900)
카드 hover: #1f1f23  (zinc-850 custom)
border:     #27272a  (zinc-800, subtle)
border+:    #3f3f46  (zinc-700, emphasis)

텍스트 1:   #fafafa  (zinc-50)
텍스트 2:   #a1a1aa  (zinc-400)
텍스트 3:   #71717a  (zinc-500)

Accent 1:   #3b82f6  (blue-500)
Accent 2:   #ef4444  (red-500)
Accent 3:   #22c55e  (green-500)
Accent 4:   #f59e0b  (amber-500)

폰트:       Noto Sans KR (Korean), system-ui (fallback)
폰트 크기:  12px(xs) / 14px(sm) / 16px(base) / 20px(lg headers)
```
