import { NextResponse } from "next/server";
import { MOCK_KPI } from "../_data/mockData";

// GET /api/v1/kpi — 현재 KPI 4지표 + 매출 추이
export async function GET() {
  return NextResponse.json(MOCK_KPI);
}
