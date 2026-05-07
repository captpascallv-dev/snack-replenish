const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const db = new Database(path.join(__dirname, "..", "prisma", "dev.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// 加密
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

// 表结构与 db.ts 保持一致
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STORE_MANAGER',
    storeId TEXT,
    FOREIGN KEY (storeId) REFERENCES stores(id)
  );
  CREATE TABLE IF NOT EXISTS replenishment_requests (
    id TEXT PRIMARY KEY,
    storeId TEXT NOT NULL,
    productName TEXT NOT NULL,
    quantityNeeded REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT '公斤',
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING',
    requestedBy TEXT NOT NULL,
    userId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (storeId) REFERENCES stores(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS fulfillments (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL UNIQUE,
    orderDate TEXT NOT NULL,
    supplier TEXT NOT NULL,
    kg REAL,
    caseSpec TEXT,
    caseCount INTEGER,
    orderNotes TEXT,
    FOREIGN KEY (requestId) REFERENCES replenishment_requests(id)
  );
  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL UNIQUE,
    arrivalDate TEXT NOT NULL,
    actualQuantity REAL NOT NULL,
    feedback TEXT NOT NULL,
    FOREIGN KEY (requestId) REFERENCES replenishment_requests(id)
  );
`);

// 清理旧数据
db.prepare("DELETE FROM receipts").run();
db.prepare("DELETE FROM fulfillments").run();
db.prepare("DELETE FROM replenishment_requests").run();
db.prepare("DELETE FROM users").run();
db.prepare("DELETE FROM stores").run();

// 门店
db.prepare("INSERT INTO stores (id, name) VALUES (?, ?)").run("store-1", "中洲湾旗舰店");
db.prepare("INSERT INTO stores (id, name) VALUES (?, ?)").run("store-2", "科技园分店（筹备中）");

// 用户 (密码统一: 123456)
const pw = hashPassword("123456");
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?, ?, ?, ?, ?, ?)")
  .run("user-1", "Pascal", "pascal@snack.test", pw, "OWNER", null);
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?, ?, ?, ?, ?, ?)")
  .run("user-2", "小王", "wang@snack.test", pw, "STORE_MANAGER", "store-1");
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?, ?, ?, ?, ?, ?)")
  .run("user-3", "小李", "li@snack.test", pw, "STORE_MANAGER", "store-1");
db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?, ?, ?, ?, ?, ?)")
  .run("user-4", "小张", "zhang@snack.test", pw, "STORE_MANAGER", "store-2");

// 补货请求
db.prepare(`
  INSERT INTO replenishment_requests (id, storeId, productName, quantityNeeded, unit, notes, status, requestedBy, userId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "req-1", "store-1", "原味坚果混合装", 10, "盒", "周末促销活动备货，请尽快", "PENDING", "小王", "user-2",
  "2026-05-07T09:30:00.000Z", "2026-05-07T09:30:00.000Z"
);

db.prepare(`
  INSERT INTO replenishment_requests (id, storeId, productName, quantityNeeded, unit, notes, status, requestedBy, userId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "req-2", "store-1", "海苔肉松卷", 20, "袋", "", "ORDERED", "小王", "user-2",
  "2026-05-06T15:20:00.000Z", "2026-05-07T00:00:00.000Z"
);
db.prepare(`
  INSERT INTO fulfillments (id, requestId, orderDate, supplier, kg, caseSpec, caseCount, orderNotes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run("f-1", "req-2", "2026-05-07", "天虹食品批发", 15, "24袋/箱", 3, "供应商说周三前到");

db.prepare(`
  INSERT INTO replenishment_requests (id, storeId, productName, quantityNeeded, unit, notes, status, requestedBy, userId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "req-3", "store-1", "冻干草莓脆", 5, "公斤", "最近卖得很快", "RECEIVED", "小李", "user-3",
  "2026-05-04T11:00:00.000Z", "2026-05-06T00:00:00.000Z"
);
db.prepare(`
  INSERT INTO fulfillments (id, requestId, orderDate, supplier, kg, caseSpec, caseCount)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run("f-2", "req-3", "2026-05-04", "广州果干厂家", 5, "1公斤/袋", 5);
db.prepare(`
  INSERT INTO receipts (id, requestId, arrivalDate, actualQuantity, feedback)
  VALUES (?, ?, ?, ?, ?)
`).run("r-1", "req-3", "2026-05-06", 5, "品质OK，包装完好");

db.prepare(`
  INSERT INTO replenishment_requests (id, storeId, productName, quantityNeeded, unit, notes, status, requestedBy, userId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "req-4", "store-1", "低脂鸡胸肉干", 8, "盒", "", "PENDING", "小李", "user-3",
  "2026-05-07T08:15:00.000Z", "2026-05-07T08:15:00.000Z"
);

db.prepare(`
  INSERT INTO replenishment_requests (id, storeId, productName, quantityNeeded, unit, notes, status, requestedBy, userId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "req-5", "store-2", "原味坚果混合装", 15, "盒", "新店首批备货", "PENDING", "小张", "user-4",
  "2026-05-07T07:45:00.000Z", "2026-05-07T07:45:00.000Z"
);

console.log("Seed complete: 2 stores, 4 users, 5 requests");
console.log("Test accounts: pascal@snack.test / wang@snack.test / li@snack.test / zhang@snack.test (pw: 123456)");
db.close();
