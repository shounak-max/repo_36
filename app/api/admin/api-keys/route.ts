import { NextRequest, NextResponse } from "next/server";
import { createApiKey, requireAdminKey } from "@/lib/auth";
import { handleApi, readJsonBody } from "@/lib/http";
import { adminCreateApiKeySchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApi(request, async ({ request }) => {
    requireAdminKey(request);
    const body = adminCreateApiKeySchema.parse(await readJsonBody(request));
    const apiKey = await createApiKey(body);
    return NextResponse.json(apiKey, { status: 201 });
  });
}
