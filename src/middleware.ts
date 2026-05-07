import { NextRequest, NextResponse } from "next/server";

// 轻量验证，不依赖 db.ts（middleware 跑在 Edge runtime）
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 首页（登录页）和白名单
  if (pathname === "/") {
    // 已登录则跳转 dashboard
    const session = parseSession(request);
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 检查 (app) 下的页面
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/api/requests") ||
    pathname.startsWith("/api/stores")
  ) {
    const session = parseSession(request);
    if (!session) {
      // API 请求返回 401
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
