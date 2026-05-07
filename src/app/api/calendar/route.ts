import { NextRequest, NextResponse } from "next/server";
import { getCalendarActivity } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "请提供日期参数 ?date=YYYY-MM-DD" }, { status: 400 });

  const activity = await getCalendarActivity(date, user.role, user.storeId);
  return NextResponse.json(activity);
}
