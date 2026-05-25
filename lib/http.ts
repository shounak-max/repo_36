import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, type AuthContext } from "@/lib/auth";
import { errorResponse, normalizeError } from "@/lib/errors";
import { logRequest } from "@/lib/logging";
import { enforceRateLimit } from "@/lib/rateLimit";
import type { ApiKeyScope } from "@/lib/validators";

type HandlerContext = {
  request: NextRequest;
  auth?: AuthContext;
};

type HandlerOptions = {
  auth?: {
    scopes: ApiKeyScope[];
  };
  rateLimit?: boolean;
};

export async function handleApi(
  request: NextRequest,
  handler: (context: HandlerContext) => Promise<NextResponse>,
  options: HandlerOptions = {}
): Promise<NextResponse> {
  const started = Date.now();
  let keyId: string | undefined;
  let status = 500;
  let errorCode: string | undefined;

  try {
    const auth = options.auth ? await authenticateRequest(request, options.auth.scopes) : undefined;
    keyId = auth?.keyId;

    const rateLimitHeaders = auth && options.rateLimit !== false ? enforceRateLimit(auth.keyId) : {};
    const response = await handler({ request, auth });

    Object.entries(rateLimitHeaders).forEach(([name, value]) => {
      response.headers.set(name, String(value));
    });

    status = response.status;
    return response;
  } catch (error) {
    const normalized = normalizeError(error);
    status = normalized.status;
    errorCode = normalized.code;
    return errorResponse(normalized);
  } finally {
    logRequest({
      method: request.method,
      path: request.nextUrl.pathname,
      status,
      latency_ms: Date.now() - started,
      key_id: keyId,
      error_code: errorCode
    });
  }
}

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    const { ApiError } = await import("@/lib/errors");
    throw new ApiError(400, "BAD_REQUEST", "Request body must be valid JSON.");
  }
}
