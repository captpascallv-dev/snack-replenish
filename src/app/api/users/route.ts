import { NextRequest, NextResponse } from "next/server";
import { listUsers, createUser } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "仅超级管理员可访问" }, { status: 403 });
  }
  return NextResponse.json(await listUsers());
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "仅超级管理员可访问" }, { status: 403 });
  }
  const { username, name, password, role, storeId } = await request.json();
  if (!username || !name || !password || !role) {
    return NextResponse.json({ error: "用户名、姓名、密码、角色为必填" }, { status: 400 });
  }
  if (!["PARTNER", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "角色只能为 PARTNER 或 STORE_MANAGER" }, { status: 400 });
  }
  if (role === "STORE_MANAGER" && !storeId) {
    return NextResponse.json({ error: "店员必须指定门店" }, { status: 400 });
  }
  const newUser = await createUser({
    id: `user-${Date.now()}`,
    name,
    username,
    password,
    role,
    storeId: role === "PARTNER" ? null : storeId,
  });
  return NextResponse.json(newUser, { status: 201 });
}
