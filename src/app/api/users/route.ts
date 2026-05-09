import { NextRequest, NextResponse } from "next/server";
import { listUsers, createUser } from "@/lib/db";
import { getSession } from "@/lib/session";

function canManage(user: { role: string } | null) {
  return user && (user.role === "OWNER" || user.role === "PARTNER");
}

export async function GET() {
  const user = await getSession();
  if (!canManage(user)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  return NextResponse.json(await listUsers());
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!canManage(user)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { username, name, password, role, storeId } = await request.json();
  if (!username || !name || !password || !role) {
    return NextResponse.json({ error: "用户名、姓名、密码、角色为必填" }, { status: 400 });
  }
  if (!["PARTNER", "STORE_LEADER", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "无效角色" }, { status: 400 });
  }
  // 合伙人只能创建店员/店长
  if (user!.role === "PARTNER" && !["STORE_LEADER", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "合伙人只能创建店员/店长账号" }, { status: 403 });
  }
  if ((role === "STORE_MANAGER" || role === "STORE_LEADER") && !storeId) {
    return NextResponse.json({ error: "店员/店长必须指定门店" }, { status: 400 });
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
