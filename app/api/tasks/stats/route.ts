import { NextRequest, NextResponse } from "next/server";
import { handleApi } from "@/lib/http";
import { getTaskStats } from "@/lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleApi(
    request,
    async () => {
      const stats = await getTaskStats();
      return NextResponse.json(stats, {
        headers: {
          "Cache-Control": "s-maxage=30, stale-while-revalidate=30",
          Vary: "X-API-Key"
        }
      });
    },
    { auth: { scopes: ["tasks:read"] } }
  );
}
