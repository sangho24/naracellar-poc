import { NextResponse } from "next/server";
import { MOCK_WHATIF } from "../../_data/mockData";

// POST /api/v1/whatif/recommend — AI 최적조합 추천 (mock fallback)
// 향후 GEMINI_API_KEY 환경변수가 있을 때 실제 LLM 호출하도록 확장 여지
export async function POST(_request: Request) {
  return NextResponse.json(MOCK_WHATIF);
}
