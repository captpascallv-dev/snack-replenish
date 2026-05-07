import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---- Schema init ----
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

export default db;

// ---- Types ----
export type Role = "OWNER" | "STORE_MANAGER";
export type RequestStatus = "PENDING" | "ORDERED" | "RECEIVED";

export interface Store {
  id: string; name: string;
}
export interface User {
  id: string; name: string; email: string; role: Role; storeId: string | null;
}
export interface Fulfillment {
  orderDate: string; supplier: string;
  kg?: number; caseSpec?: string; caseCount?: number; orderNotes?: string;
}
export interface Receipt {
  arrivalDate: string; actualQuantity: number; feedback: string;
}
export interface ReplenishmentRequest {
  id: string; storeId: string; productName: string; quantityNeeded: number;
  unit: string; notes: string; status: RequestStatus; requestedBy: string;
  userId?: string; createdAt: string; updatedAt: string;
  store?: Store; fulfillment?: Fulfillment; receipt?: Receipt;
}

// ---- Auth ----
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verify;
}

export function getUserByEmail(email: string): User | undefined {
  const row = db.prepare("SELECT id, name, email, role, storeId FROM users WHERE email = ?").get(email) as any;
  if (!row) return undefined;
  return { id: row.id, name: row.name, email: row.email, role: row.role, storeId: row.storeId };
}

export function verifyLogin(email: string, password: string): User | null {
  const row = db.prepare("SELECT id, name, email, password, role, storeId FROM users WHERE email = ?").get(email) as any;
  if (!row) return null;
  if (!verifyPassword(password, row.password)) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role, storeId: row.storeId };
}

export function createUser(data: { id: string; name: string; email: string; password: string; role: Role; storeId?: string | null }): User {
  const hashed = hashPassword(data.password);
  db.prepare("INSERT INTO users (id, name, email, password, role, storeId) VALUES (?, ?, ?, ?, ?, ?)").run(
    data.id, data.name, data.email, hashed, data.role, data.storeId ?? null
  );
  return { id: data.id, name: data.name, email: data.email, role: data.role, storeId: data.storeId ?? null };
}

// ---- Queries ----
export function getStores(): Store[] {
  return db.prepare("SELECT * FROM stores ORDER BY name").all() as Store[];
}

export function getStoreById(id: string): Store | undefined {
  return db.prepare("SELECT * FROM stores WHERE id = ?").get(id) as Store | undefined;
}

export function getUserById(id: string): User | undefined {
  const row = db.prepare("SELECT id, name, email, role, storeId FROM users WHERE id = ?").get(id) as any;
  if (!row) return undefined;
  return { id: row.id, name: row.name, email: row.email, role: row.role, storeId: row.storeId };
}

export function getRequestsByRole(role: Role, storeId: string | null): ReplenishmentRequest[] {
  let rows: any[];
  if (role === "OWNER") {
    rows = db.prepare(`
      SELECT r.*, s.name as storeName FROM replenishment_requests r
      LEFT JOIN stores s ON r.storeId = s.id
      ORDER BY r.createdAt DESC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT r.*, s.name as storeName FROM replenishment_requests r
      LEFT JOIN stores s ON r.storeId = s.id
      WHERE r.storeId = ?
      ORDER BY r.createdAt DESC
    `).all(storeId);
  }
  return rows.map(rowToRequest);
}

export function getRequestById(id: string): ReplenishmentRequest | undefined {
  const row = db.prepare(`
    SELECT r.*, s.name as storeName FROM replenishment_requests r
    LEFT JOIN stores s ON r.storeId = s.id
    WHERE r.id = ?
  `).get(id) as any;
  if (!row) return undefined;
  return rowToRequest(row);
}

function rowToRequest(row: any): ReplenishmentRequest {
  const req: ReplenishmentRequest = {
    id: row.id, storeId: row.storeId, productName: row.productName,
    quantityNeeded: row.quantityNeeded, unit: row.unit, notes: row.notes || "",
    status: row.status, requestedBy: row.requestedBy, userId: row.userId,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    store: { id: row.storeId, name: row.storeName || "" },
  };
  const f = db.prepare("SELECT * FROM fulfillments WHERE requestId = ?").get(row.id) as any;
  if (f) {
    req.fulfillment = { orderDate: f.orderDate, supplier: f.supplier };
    if (f.kg != null) req.fulfillment.kg = f.kg;
    if (f.caseSpec) req.fulfillment.caseSpec = f.caseSpec;
    if (f.caseCount != null) req.fulfillment.caseCount = f.caseCount;
    if (f.orderNotes) req.fulfillment.orderNotes = f.orderNotes;
  }
  const r = db.prepare("SELECT * FROM receipts WHERE requestId = ?").get(row.id) as any;
  if (r) req.receipt = { arrivalDate: r.arrivalDate, actualQuantity: r.actualQuantity, feedback: r.feedback };
  return req;
}

export function createRequest(data: {
  storeId: string; productName: string; quantityNeeded: number;
  unit?: string; notes?: string; requestedBy: string; userId?: string;
}): ReplenishmentRequest {
  const id = `req-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO replenishment_requests (id, storeId, productName, quantityNeeded, unit, notes, status, requestedBy, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
  `).run(id, data.storeId, data.productName, data.quantityNeeded,
    data.unit || "公斤", data.notes || "", data.requestedBy, data.userId || null, now, now);
  return getRequestById(id)!;
}

export function createFulfillment(requestId: string, data: {
  orderDate: string; supplier: string; kg?: number; caseSpec?: string;
  caseCount?: number; orderNotes?: string;
}): void {
  const id = `ful-${Date.now()}`;
  db.prepare(`
    INSERT INTO fulfillments (id, requestId, orderDate, supplier, kg, caseSpec, caseCount, orderNotes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, requestId, data.orderDate, data.supplier,
    data.kg ?? null, data.caseSpec ?? null, data.caseCount ?? null, data.orderNotes ?? null);
  db.prepare("UPDATE replenishment_requests SET status = 'ORDERED', updatedAt = ? WHERE id = ?")
    .run(new Date().toISOString(), requestId);
}

export function createReceipt(requestId: string, data: {
  arrivalDate: string; actualQuantity: number; feedback: string;
}): void {
  const id = `rec-${Date.now()}`;
  db.prepare(`
    INSERT INTO receipts (id, requestId, arrivalDate, actualQuantity, feedback)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, requestId, data.arrivalDate, data.actualQuantity, data.feedback);
  db.prepare("UPDATE replenishment_requests SET status = 'RECEIVED', updatedAt = ? WHERE id = ?")
    .run(new Date().toISOString(), requestId);
}

export function countRequestsByStatus(status: RequestStatus, storeId?: string | null): number {
  if (storeId) {
    const row = db.prepare("SELECT COUNT(*) as cnt FROM replenishment_requests WHERE status = ? AND storeId = ?").get(status, storeId) as any;
    return row.cnt;
  }
  const row = db.prepare("SELECT COUNT(*) as cnt FROM replenishment_requests WHERE status = ?").get(status) as any;
  return row.cnt;
}
