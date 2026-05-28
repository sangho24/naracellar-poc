# 나라셀라 PoC — Vercel 배포 가이드

> 백엔드 분리 완료. 이 PoC는 **Next.js 14 풀스택 (App Router + Route Handlers)** 으로 단일 배포.
> SSE·KPI·Alert·KG·Action·What-If 모두 `frontend/app/api/v1/**` 안에서 동작.

---

## 1. 로컬 확인

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000/dashboard
```

별도 백엔드 띄울 필요 없음. API 호출은 Next.js Route Handlers가 처리.

---

## 2. Vercel 배포 — 2가지 방법

### 방법 A — GitHub 연동 (권장, 자동 재배포)
1. GitHub에 이 repo push
2. https://vercel.com/new → **Import Git Repository** → 이 repo 선택
3. **Root Directory**: `frontend` 지정 (중요 — 프로젝트 루트가 아닌 `frontend` 폴더)
4. Framework Preset: Next.js (자동 감지)
5. Deploy 클릭 → ~2분 후 `https://<프로젝트명>.vercel.app` 발급
6. 이후 `main` 브랜치 push 마다 자동 재배포

### 방법 B — Vercel CLI (즉시 배포)
```bash
npm install -g vercel
cd frontend
vercel              # 첫 배포 — 질문 몇 개에 답하면 preview URL
vercel --prod       # production 배포
```

---

## 3. 환경변수 (선택)

현재 모든 API가 Mock fallback이라 환경변수 없어도 데모 작동.
추후 실 LLM 호출하려면 Vercel Project Settings → Environment Variables 에서:

| 키 | 값 | 용도 |
|---|---|---|
| `GEMINI_API_KEY` | (Google AI Studio 키) | Whatif recommend·analyze LLM 호출 |

추가 시 Route Handler에서 `process.env.GEMINI_API_KEY` 분기로 mock → real 전환 가능.

---

## 4. 도메인

- 기본: `<프로젝트명>.vercel.app` (HTTPS 자동)
- 커스텀 도메인: Vercel Settings → Domains → CNAME 설정

---

## 5. 트러블슈팅

| 증상 | 해결 |
|---|---|
| 배포 후 SSE가 끊김 | Hobby plan 10초 제한. 현재 분석은 ~6초라 OK. 더 길어지면 Pro 업그레이드 |
| Build fail "Cannot find module" | `frontend` 폴더를 Root Directory로 지정했는지 확인 |
| 동료가 보는데 데이터가 비어있음 | Vercel Functions 첫 cold start ~3초. 한 번 호출 후 정상 |

---

## 아키텍처 (배포 관점)

```
[브라우저]
    ↓
[Vercel — Next.js Standalone + Functions]
    ├── /dashboard (페이지)
    └── /api/v1/* (Route Handlers — 모두 Mock 응답)
```

별도 백엔드, 별도 DB, 별도 호스팅 0개. **한 곳에서 다 동작.**
