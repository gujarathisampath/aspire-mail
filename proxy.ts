import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const proxy = (request: NextRequest) => {
  const sessionCookie = request.cookies.get("mail-session")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/mail/inbox", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (!sessionCookie && pathname.startsWith("/mail")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/mail/inbox", request.url));
  }

  if (pathname.startsWith("/mail/INBOX")) {
    return NextResponse.redirect(new URL("/mail/inbox", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/", "/mail/:path*", "/login"],
};
