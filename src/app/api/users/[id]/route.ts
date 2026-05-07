import { NextRequest, NextResponse } from "next/server";
import { updateUser, getUserById } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "仅超级管理员可操作" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const updated = await updateUser(id, body);
  if (!updated) return NextResponse.json({ error: "未找到用户" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "仅超级管理员可操作" }, { status: 403 });
  }
  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "未找到用户" }, { status: 404 });
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "不能禁用超级管理员" }, { status: 403 });
  }
  const { deleteUser } = await import("@/lib/db");
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
