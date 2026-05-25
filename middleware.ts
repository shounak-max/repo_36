import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest): NextResponse {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const shouldForceHttps = process.env.VERCEL === "1" || process.env.FORCE_HTTPS === "true";

  if (process.env.NODE_ENV === "production" && shouldForceHttps && forwardedProto === "http") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();
  if (process.env.NODE_ENV === "production" && shouldForceHttps) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
