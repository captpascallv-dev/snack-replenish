import { NextRequest, NextResponse } from "next/server";
import { updateUser, getUserById } from "@/lib/db";
import { getSession } from "@/lib/session";

function canManage(user: { role: string } | null) {
  return user && (user.role === "OWNER" || user.role === "PARTNER");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!canManage(user)) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }
  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "未找到用户" }, { status: 404 });
  // 合伙人不能修改 OWNER 或其他合伙人
  if (user!.role === "PARTNER" && (target.role === "OWNER" || target.role === "PARTNER")) {
    return NextResponse.json({ error: "合伙人只能修改店员信息" }, { status: 403 });
  }
  const body = await request.json();
  // 合伙人不能提权
  if (user!.role === "PARTNER" && body.role && body.role !== "STORE_MANAGER") {
    return NextResponse.json({ error: "合伙人不能设置该角色" }, { status: 403 });
  }
  const updated = await updateUser(id, body);
  if (!updated) return NextResponse.json({ error: "未找到用户" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!canManage(user)) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }
  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "未找到用户" }, { status: 404 });
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "不能禁用超级管理员" }, { status: 403 });
  }
  if (user!.role === "PARTNER" && target.role === "PARTNER") {
    return NextResponse.json({ error: "合伙人不能禁用其他合伙人" }, { status: 403 });
  }
  const { deleteUser } = await import("@/lib/db");
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
