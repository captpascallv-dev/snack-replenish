import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { oldPassword, newPassword } = await request.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "旧密码和新密码为必填" }, { status: 400 });
  }
  if (newPassword.length < 4) {
    return NextResponse.json({ error: "新密码至少4位" }, { status: 400 });
  }

  const ok = await changePassword(user.id, oldPassword, newPassword);
  if (!ok) {
    return NextResponse.json({ error: "旧密码错误" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
