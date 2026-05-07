import { NextRequest, NextResponse } from "next/server";

function parseSession(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const [payload] = token.split(".");
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const session = parseSession(request);
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/requests") ||
    pathname.startsWith("/api/stores") ||
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/auth/password")
  ) {
    const session = parseSession(request);
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "未登录" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
