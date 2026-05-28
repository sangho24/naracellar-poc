import { buildAnalyzeSteps } from "../_data/mockData";

// GET /api/v1/analyze?alert_id=ALT-001 — LangGraph Agent SSE 스트림 (4 step + done)
// Vercel Hobby plan 10s 제한 안에 끝나도록 step 간격은 1~1.5초

export const runtime = "nodejs";  // SSE 호환을 위해 nodejs runtime 명시
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const alertId = url.searchParams.get("alert_id") ?? "ALT-001";
  const steps = buildAnalyzeSteps(alertId);
  const delays = [1200, 1500, 1800, 1200];  // 각 노드별 지연 (ms)

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < steps.length; i++) {
          await sleep(delays[i] ?? 1200);
          const payload = `event: step\ndata: ${JSON.stringify(steps[i])}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }
        // done 이벤트
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ message: "분석 완료" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",  // nginx/Vercel 버퍼링 disable
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
