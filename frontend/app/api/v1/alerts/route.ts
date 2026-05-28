import { NextResponse } from "next/server";
import { MOCK_ALERTS } from "../_data/mockData";

// GET /api/v1/alerts — 이상 감지 알림 (매출 + 휴면 거래처)
export async function GET() {
  return NextResponse.json(MOCK_ALERTS);
}
