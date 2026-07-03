import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * Machine-to-machine routes that already carry their own secret/are meant
 * for monitoring, and can't complete an interactive Basic Auth challenge.
 */
const UNPROTECTED_PATHS = ["/api/webhooks/n8n", "/api/health"];

/**
 * A simple HTTP Basic Auth gate for the whole app. Founder OS has no user
 * accounts (single-founder by design — see docs/decisions), so once this is
 * deployed to a public URL, anyone with the link could see and edit real
 * business data without this. Set `SITE_PASSWORD` before deploying publicly;
 * if it's unset, the gate is a no-op (off by default for local dev).
 */
export function middleware(request: NextRequest) {
  if (!env.SITE_PASSWORD) return NextResponse.next();
  if (UNPROTECTED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const [, password] = atob(authHeader.slice("Basic ".length)).split(":");
    if (password === env.SITE_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Founder OS"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
