import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = (request: NextRequest) => {
  // We now rely on mail-session as the source of truth
  const sessionCookie = request.cookies.get("mail-session")?.value;
  const { pathname } = request.nextUrl;

  // Root path should also redirect based on auth status
  if (pathname === "/") {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/mail/inbox", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect /mail routes: Require mail-session
  // (Previously we checked auth-token which caused a mismatch if session was missing)
  if (!sessionCookie && pathname.startsWith("/mail")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect from /login if already authenticated
  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/mail/inbox", request.url));
  }

  // Normalize INBOX in URL to lowercase 'inbox'
  if (pathname.startsWith("/mail/INBOX")) {
    return NextResponse.redirect(new URL("/mail/inbox", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/", "/mail/:path*", "/login"],
};
