import { NextResponse } from "next/server";
import { MOCK_ACTION_RESULTS } from "../../../_data/mockData";

// POST /api/v1/actions/{id}/execute — 액션 시뮬레이션 결과
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const result = MOCK_ACTION_RESULTS[params.id];
  if (!result) {
    return NextResponse.json(
      { detail: `Action '${params.id}'를 찾을 수 없습니다.` },
      { status: 404 }
    );
  }
  return NextResponse.json({
    action_id: params.id,
    status: "simulated",
    simulated_impact: result,
  });
}
