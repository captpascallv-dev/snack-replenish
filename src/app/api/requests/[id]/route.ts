import { NextRequest, NextResponse } from "next/server";
import { getRequestById, createFulfillment, createReceipt } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const req = getRequestById(id);
  if (!req) return NextResponse.json({ error: "未找到" }, { status: 404 });

  // 店长只能看自己门店的
  if (user.role !== "OWNER" && req.storeId !== user.storeId) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  return NextResponse.json(req);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = getRequestById(id);
  if (!existing) return NextResponse.json({ error: "未找到" }, { status: 404 });

  // 权限：只有 OWNER 能填写订货，店长只能确认自己门店的到货
  if (body.action === "fulfill" && user.role !== "OWNER") {
    return NextResponse.json({ error: "仅老板可填写订货信息" }, { status: 403 });
  }
  if (body.action === "receive") {
    if (existing.storeId !== user.storeId) {
      return NextResponse.json({ error: "只能确认自己门店的到货" }, { status: 403 });
    }
  }

  if (body.action === "fulfill") {
    const { orderDate, supplier, kg, caseSpec, caseCount, orderNotes } = body;
    if (!orderDate || !supplier) {
      return NextResponse.json({ error: "订货日期和供应商为必填" }, { status: 400 });
    }
    createFulfillment(id, { orderDate, supplier, kg, caseSpec, caseCount, orderNotes });
  } else if (body.action === "receive") {
    const { arrivalDate, actualQuantity, feedback } = body;
    if (!arrivalDate || actualQuantity == null || !feedback) {
      return NextResponse.json({ error: "到货日期、实收数量、验货反馈为必填" }, { status: 400 });
    }
    createReceipt(id, { arrivalDate, actualQuantity: Number(actualQuantity), feedback });
  } else {
    return NextResponse.json({ error: "未知操作，action 须为 fulfill 或 receive" }, { status: 400 });
  }

  return NextResponse.json(getRequestById(id));
}
