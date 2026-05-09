import { NextRequest, NextResponse } from "next/server";
import { verifyLogin } from "@/lib/db";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码为必填" }, { status: 400 });
    }

    const user = await verifyLogin(username, password);
    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    await setSession(user);
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: "服务器内部错误，请稍后重试" }, { status: 500 });
  }
}
