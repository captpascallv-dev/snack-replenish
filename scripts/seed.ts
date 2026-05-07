// 种子数据 — npx tsx scripts/seed.ts
import { Pool } from "pg";
import { createUser } from "../src/lib/db";

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:idEQpOoApr83mAB2@db.prvgbgouexmhinxphuwh.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false },
  });

  await pool.query("DELETE FROM receipts");
  await pool.query("DELETE FROM fulfillments");
  await pool.query('DELETE FROM replenishment_requests');
  await pool.query("DELETE FROM users");
  await pool.query("DELETE FROM stores");

  await pool.query("INSERT INTO stores (id, name) VALUES ($1, $2), ($3, $4)",
    ["store-1", "中洲湾旗舰店", "store-2", "科技园分店（筹备中）"]);

  await createUser({ id: "user-1", name: "Pascal", email: "pascal@snack.com", password: "123456", role: "OWNER" });
  await createUser({ id: "user-2", name: "小王", email: "wang@snack.com", password: "123456", role: "STORE_MANAGER", storeId: "store-1" });
  await createUser({ id: "user-3", name: "小李", email: "li@snack.com", password: "123456", role: "STORE_MANAGER", storeId: "store-1" });
  await createUser({ id: "user-4", name: "小张", email: "zhang@snack.com", password: "123456", role: "STORE_MANAGER", storeId: "store-2" });

  const now = new Date().toISOString();

  async function addReq(id: string, storeId: string, productName: string, qty: number, unit: string, notes: string, status: string, requestedBy: string, userId: string, createdAt: string) {
    await pool.query(
      `INSERT INTO replenishment_requests (id, "storeId", "productName", "quantityNeeded", unit, notes, status, "requestedBy", "userId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, storeId, productName, qty, unit, notes, status, requestedBy, userId, createdAt, now]
    );
  }

  await addReq("req-1", "store-1", "原味坚果混合装", 10, "盒", "周末促销活动备货，请尽快", "PENDING", "小王", "user-2", "2026-05-07T09:30:00.000Z");
  await addReq("req-2", "store-1", "海苔肉松卷", 20, "袋", "", "ORDERED", "小王", "user-2", "2026-05-06T15:20:00.000Z");
  await addReq("req-3", "store-1", "冻干草莓脆", 5, "公斤", "最近卖得很快", "RECEIVED", "小李", "user-3", "2026-05-04T11:00:00.000Z");
  await addReq("req-4", "store-1", "低脂鸡胸肉干", 8, "盒", "", "PENDING", "小李", "user-3", "2026-05-07T08:15:00.000Z");
  await addReq("req-5", "store-2", "原味坚果混合装", 15, "盒", "新店首批备货", "PENDING", "小张", "user-4", "2026-05-07T07:45:00.000Z");

  await pool.query(
    `INSERT INTO fulfillments (id, "requestId", "orderDate", supplier, kg, "caseSpec", "caseCount", "orderNotes") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ["ful-2", "req-2", "2026-05-07", "天虹食品批发", 15, "24袋/箱", 3, "供应商说周三前到"]
  );

  await pool.query(
    `INSERT INTO fulfillments (id, "requestId", "orderDate", supplier, kg, "caseSpec", "caseCount") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    ["ful-3", "req-3", "2026-05-04", "广州果干厂家", 5, "1公斤/袋", 5]
  );
  await pool.query(
    `INSERT INTO receipts (id, "requestId", "arrivalDate", "actualQuantity", feedback) VALUES ($1,$2,$3,$4,$5)`,
    ["rec-3", "req-3", "2026-05-06", 5, "品质OK，包装完好"]
  );

  const { rows: stores } = await pool.query("SELECT count(*) as c FROM stores");
  const { rows: users } = await pool.query("SELECT count(*) as c FROM users");
  const { rows: reqs } = await pool.query('SELECT count(*) as c FROM replenishment_requests');
  console.log(`Seed done: ${stores[0].c} stores, ${users[0].c} users, ${reqs[0].c} requests`);
  await pool.end();
}

seed().catch(console.error);
