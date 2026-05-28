import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', "Apple SD Gothic Neo", "Malgun Gothic", "system-ui", "sans-serif"],
        serif: ["'Cormorant Garamond'", "'Noto Serif KR'", "serif"],
      },
      colors: {
        // 나라셀라 브랜드 컬러 (홈페이지 #9a253c 기준)
        brand: {
          primary: "#9a253c",
          primaryDark: "#7d1e32",
          primaryLight: "#fbeef1",
          primaryBorder: "#e8c5cd",
          accent: "#b89a65",
          accentLight: "#f2ebdb",
        },
        // 베이스 (라이트 톤, 따뜻한 베이지)
        canvas: "#faf9f6",
        surface: "#ffffff",
        ink: {
          900: "#1a1410",
          700: "#3d342d",
          500: "#6f6760",
          300: "#a8a29e",
          100: "#e8e5de",
        },
        line: {
          DEFAULT: "#e8e5de",
          strong: "#d4cfc4",
        },
        positive: "#2d7d3f",
        warning: "#b45309",
        danger: "#c7373b",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26, 20, 16, 0.04), 0 0 0 1px rgba(26, 20, 16, 0.04)",
        cardHover: "0 2px 8px rgba(26, 20, 16, 0.06), 0 0 0 1px rgba(154, 37, 60, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
