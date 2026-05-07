import { NextRequest, NextResponse } from "next/server";
import { verifyLogin } from "@/lib/db";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码为必填" }, { status: 400 });
  }

  const user = await verifyLogin(email, password);
  if (!user) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  await setSession(user);
  return NextResponse.json({ ok: true, user });
}
