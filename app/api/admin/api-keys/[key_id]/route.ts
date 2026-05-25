import { NextRequest, NextResponse } from "next/server";
import { requireAdminKey, revokeApiKey } from "@/lib/auth";
import { handleApi } from "@/lib/http";
import { uuidSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KeyRouteContext = {
  params: Promise<{ key_id: string }>;
};

export async function DELETE(request: NextRequest, context: KeyRouteContext): Promise<NextResponse> {
  return handleApi(request, async ({ request }) => {
    requireAdminKey(request);
    const params = await context.params;
    await revokeApiKey(uuidSchema.parse(params.key_id));
    return new NextResponse(null, { status: 204 });
  });
}
