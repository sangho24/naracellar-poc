import { NextResponse } from "next/server";
import { MOCK_GRAPH } from "../../_data/mockData";

// GET /api/v1/graph/{id} — Knowledge Graph 노드/엣지 (현재 강남도매 고정 mock)
export async function GET(
  _request: Request,
  { params: _params }: { params: { id: string } }
) {
  return NextResponse.json(MOCK_GRAPH);
}
