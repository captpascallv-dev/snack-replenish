// 种子数据 — npx tsx scripts/seed.ts

import db from "../src/lib/db";

// Clean
db.exec("DELETE FROM receipts");
db.exec("DELETE FROM fulfillments");
db.exec("DELETE FROM replenishment_requests");
db.exec("DELETE FROM users");
db.exec("DELETE FROM stores");

// Stores
db.prepare("INSERT INTO stores (id, name) VALUES (?, ?)").run("store-1", "中洲湾旗舰店");
db.prepare("INSERT INTO stores (id, name) VALUES (?, ?)").run("store-2", "科技园分店（筹备中）");

// Users（密码明文 123456）
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?,?,?,?,?,?)")
  .run("user-1", "Pascal", "pascal@snack.com", "123456", "OWNER", null);
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?,?,?,?,?,?)")
  .run("user-2", "小王", "wang@snack.com", "123456", "STORE_MANAGER", "store-1");
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?,?,?,?,?,?)")
  .run("user-3", "小李", "li@snack.com", "123456", "STORE_MANAGER", "store-1");
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?,?,?,?,?,?)")
  .run("user-4", "小张", "zhang@snack.com", "123456", "STORE_MANAGER", "store-2");

// Requests
const now = new Date().toISOString();

function addReq(id: string, storeId: string, productName: string, qty: number, unit: string, notes: string, status: string, requestedBy: string, userId: string, createdAt: string) {
  db.prepare(`INSERT INTO replenishment_requests (id, storeId, productName, quantityNeeded, unit, notes, status, requestedBy, userId, createdAt, updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, storeId, productName, qty, unit, notes, status, requestedBy, userId, createdAt, now);
}

addReq("req-1", "store-1", "原味坚果混合装", 10, "盒", "周末促销活动备货，请尽快", "PENDING", "小王", "user-2", "2026-05-07T09:30:00.000Z");
addReq("req-2", "store-1", "海苔肉松卷", 20, "袋", "", "ORDERED", "小王", "user-2", "2026-05-06T15:20:00.000Z");
addReq("req-3", "store-1", "冻干草莓脆", 5, "公斤", "最近卖得很快", "RECEIVED", "小李", "user-3", "2026-05-04T11:00:00.000Z");
addReq("req-4", "store-1", "低脂鸡胸肉干", 8, "盒", "", "PENDING", "小李", "user-3", "2026-05-07T08:15:00.000Z");
addReq("req-5", "store-2", "原味坚果混合装", 15, "盒", "新店首批备货", "PENDING", "小张", "user-4", "2026-05-07T07:45:00.000Z");

// Fulfillment for req-2
db.prepare("INSERT INTO fulfillments (id, requestId, orderDate, supplier, kg, caseSpec, caseCount, orderNotes) VALUES (?,?,?,?,?,?,?,?)")
  .run("ful-2", "req-2", "2026-05-07", "天虹食品批发", 15, "24袋/箱", 3, "供应商说周三前到");

// Fulfillment + Receipt for req-3
db.prepare("INSERT INTO fulfillments (id, requestId, orderDate, supplier, kg, caseSpec, caseCount) VALUES (?,?,?,?,?,?,?)")
  .run("ful-3", "req-3", "2026-05-04", "广州果干厂家", 5, "1公斤/袋", 5);
db.prepare("INSERT INTO receipts (id, requestId, arrivalDate, actualQuantity, feedback) VALUES (?,?,?,?,?)")
  .run("rec-3", "req-3", "2026-05-06", 5, "品质OK，包装完好");

const stores = db.prepare("SELECT count(*) as c FROM stores").get() as any;
const users = db.prepare("SELECT count(*) as c FROM users").get() as any;
const reqs = db.prepare("SELECT count(*) as c FROM replenishment_requests").get() as any;
console.log(`Seed done: ${stores.c} stores, ${users.c} users, ${reqs.c} requests`);
