import { NextRequest, NextResponse } from "next/server";
import { checkDatabase } from "@/lib/db";
import { logRequest } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const started = Date.now();
  let status = 503;

  try {
    const databaseOk = await checkDatabase();
    status = databaseOk ? 200 : 503;
    return NextResponse.json(
      {
        status: databaseOk ? "ok" : "degraded",
        database: databaseOk ? "connected" : "unavailable",
        timestamp: new Date().toISOString()
      },
      { status }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
        timestamp: new Date().toISOString()
      },
      { status }
    );
  } finally {
    logRequest({
      method: request.method,
      path: request.nextUrl.pathname,
      status,
      latency_ms: Date.now() - started
    });
  }
}
