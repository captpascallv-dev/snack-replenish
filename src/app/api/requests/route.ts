import { NextRequest, NextResponse } from "next/server";
import { getRequestsByRole, createRequest } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let requests = await getRequestsByRole(user.role, user.storeId);

  if (status && status !== "ALL") {
    requests = requests.filter((r) => r.status === status);
  }

  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();
  const { storeId, productName, quantityNeeded, unit, notes } = body;

  if (!storeId || !productName || quantityNeeded == null) {
    return NextResponse.json({ error: "门店、产品名、公斤数为必填项" }, { status: 400 });
  }

  const req = await createRequest({
    storeId,
    productName,
    quantityNeeded: Number(quantityNeeded),
    unit: unit || "公斤",
    notes: notes || "",
    requestedBy: user.name,
    userId: user.id,
  });

  return NextResponse.json(req, { status: 201 });
}
