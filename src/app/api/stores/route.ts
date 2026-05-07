import { NextRequest, NextResponse } from "next/server";
import { getStores, createStore } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const stores = await getStores();
  return NextResponse.json(stores);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (user.role !== "OWNER" && user.role !== "PARTNER") return NextResponse.json({ error: "仅超级管理员或合伙人可创建门店" }, { status: 403 });

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "门店名称为必填" }, { status: 400 });
  }

  const store = await createStore(name.trim());
  return NextResponse.json(store, { status: 201 });
}
