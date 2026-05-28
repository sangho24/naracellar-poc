import type { Metadata } from "next";
import "./globals.css";

// 사내망 SSL 검증 이슈로 next/font/google 대신 globals.css 의 @import 로 로드
// (브라우저가 직접 fetch — 빌드 단계 네트워크 요구 없음)

export const metadata: Metadata = {
  title: "나라셀라 Digital Command Center",
  description: "나라셀라 디지털 전환 PoC 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-canvas text-ink-900 min-h-screen font-sans">
        {/* 헤더 — 라이트 + 버건디 액센트 */}
        <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-sm">
          <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* 좌측: 브랜드 */}
            <div className="flex items-center gap-3">
              {/* 로고: 나라셀라 홈 톤 — 버건디 letter + 골드 underline */}
              <div className="flex flex-col items-center select-none leading-none">
                <span className="text-[15px] font-semibold tracking-[0.18em] text-brand-primary">
                  N<span className="text-brand-accent">A</span>RA
                </span>
                <span className="text-[8px] tracking-[0.32em] text-brand-accent mt-0.5">
                  CELLAR
                </span>
              </div>
              <div className="h-6 w-px bg-line" />
              <span className="text-sm font-semibold text-ink-900 tracking-tight">
                Digital Command Center
              </span>
            </div>

            {/* 우측: 제안사 + 담당자 + PoC 배지 */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-xs text-ink-700 font-medium">삼일회계법인 AX Node</span>
                <span className="text-[10px] text-ink-500 mt-0.5">엄상호</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-primaryLight text-brand-primary border border-brand-primaryBorder font-medium tracking-wide">
                PoC Demo
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
