import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, "storeId" FROM users WHERE email = $1', [email]
  );
  if (rows.length === 0) return undefined;
  const r = rows[0];
  return { id: r.id, name: r.name, email: r.email, role: r.role, storeId: r.storeId };
}

export async function verifyLogin(email: string, password: string): Promise<User | null> {
  const { rows } = await pool.query(
    'SELECT id, name, email, password, role, "storeId" FROM users WHERE email = $1', [email]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  if (!verifyPassword(password, r.password)) return null;
  return { id: r.id, name: r.name, email: r.email, role: r.role, storeId: r.storeId };
}

export async function createUser(data: { id: string; name: string; email: string; password: string; role: Role; storeId?: string | null }): Promise<User> {
  const hashed = hashPassword(data.password);
  await pool.query(
    'INSERT INTO users (id, name, email, password, role, "storeId") VALUES ($1, $2, $3, $4, $5, $6)',
    [data.id, data.name, data.email, hashed, data.role, data.storeId ?? null]
  );
  return { id: data.id, name: data.name, email: data.email, role: data.role, storeId: data.storeId ?? null };
}

// ---- Queries ----
export async function getStores(): Promise<Store[]> {
  const { rows } = await pool.query("SELECT id, name FROM stores ORDER BY name");
  return rows;
}

export async function getStoreById(id: string): Promise<Store | undefined> {
  const { rows } = await pool.query("SELECT id, name FROM stores WHERE id = $1", [id]);
  return rows[0];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, "storeId" FROM users WHERE id = $1', [id]
  );
  if (rows.length === 0) return undefined;
  const r = rows[0];
  return { id: r.id, name: r.name, email: r.email, role: r.role, storeId: r.storeId };
}

export async function getRequestsByRole(role: Role, storeId: string | null): Promise<ReplenishmentRequest[]> {
  let { rows } = role === "OWNER"
    ? await pool.query(
        'SELECT r.*, s.name as "storeName" FROM replenishment_requests r LEFT JOIN stores s ON r."storeId" = s.id ORDER BY r."createdAt" DESC'
      )
    : await pool.query(
        'SELECT r.*, s.name as "storeName" FROM replenishment_requests r LEFT JOIN stores s ON r."storeId" = s.id WHERE r."storeId" = $1 ORDER BY r."createdAt" DESC',
        [storeId]
      );
  return Promise.all(rows.map(rowToRequest));
}

export async function getRequestById(id: string): Promise<ReplenishmentRequest | undefined> {
  const { rows } = await pool.query(
    'SELECT r.*, s.name as "storeName" FROM replenishment_requests r LEFT JOIN stores s ON r."storeId" = s.id WHERE r.id = $1', [id]
  );
  if (rows.length === 0) return undefined;
  return rowToRequest(rows[0]);
}

async function rowToRequest(row: any): Promise<ReplenishmentRequest> {
  const req: ReplenishmentRequest = {
    id: row.id, storeId: row.storeId, productName: row.productName,
    quantityNeeded: row.quantityNeeded, unit: row.unit, notes: row.notes || "",
    status: row.status, requestedBy: row.requestedBy, userId: row.userId,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    store: { id: row.storeId, name: row.storeName || "" },
  };
  const { rows: fRows } = await pool.query(
    'SELECT * FROM fulfillments WHERE "requestId" = $1', [row.id]
  );
  if (fRows.length > 0) {
    const f = fRows[0];
    req.fulfillment = { orderDate: f.orderDate, supplier: f.supplier };
    if (f.kg != null) req.fulfillment.kg = f.kg;
    if (f.caseSpec) req.fulfillment.caseSpec = f.caseSpec;
    if (f.caseCount != null) req.fulfillment.caseCount = f.caseCount;
    if (f.orderNotes) req.fulfillment.orderNotes = f.orderNotes;
  }
  const { rows: rRows } = await pool.query(
    'SELECT * FROM receipts WHERE "requestId" = $1', [row.id]
  );
  if (rRows.length > 0) {
    const r = rRows[0];
    req.receipt = { arrivalDate: r.arrivalDate, actualQuantity: r.actualQuantity, feedback: r.feedback };
  }
  return req;
}

export async function createRequest(data: {
  storeId: string; productName: string; quantityNeeded: number;
  unit?: string; notes?: string; requestedBy: string; userId?: string;
}): Promise<ReplenishmentRequest> {
  const id = `req-${Date.now()}`;
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO replenishment_requests (id, "storeId", "productName", "quantityNeeded", unit, notes, status, "requestedBy", "userId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10)`,
    [id, data.storeId, data.productName, data.quantityNeeded, data.unit || "公斤", data.notes || "", data.requestedBy, data.userId || null, now, now]
  );
  return (await getRequestById(id))!;
}

export async function createFulfillment(requestId: string, data: {
  orderDate: string; supplier: string; kg?: number; caseSpec?: string;
  caseCount?: number; orderNotes?: string;
}): Promise<void> {
  const id = `ful-${Date.now()}`;
  await pool.query(
    `INSERT INTO fulfillments (id, "requestId", "orderDate", supplier, kg, "caseSpec", "caseCount", "orderNotes")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, requestId, data.orderDate, data.supplier, data.kg ?? null, data.caseSpec ?? null, data.caseCount ?? null, data.orderNotes ?? null]
  );
  await pool.query(
    'UPDATE replenishment_requests SET status = $1, "updatedAt" = $2 WHERE id = $3',
    ["ORDERED", new Date().toISOString(), requestId]
  );
}

export async function createReceipt(requestId: string, data: {
  arrivalDate: string; actualQuantity: number; feedback: string;
}): Promise<void> {
  const id = `rec-${Date.now()}`;
  await pool.query(
    `INSERT INTO receipts (id, "requestId", "arrivalDate", "actualQuantity", feedback)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, requestId, data.arrivalDate, data.actualQuantity, data.feedback]
  );
  await pool.query(
    'UPDATE replenishment_requests SET status = $1, "updatedAt" = $2 WHERE id = $3',
    ["RECEIVED", new Date().toISOString(), requestId]
  );
}

export async function countRequestsByStatus(status: RequestStatus, storeId?: string | null): Promise<number> {
  const { rows } = storeId
    ? await pool.query(
        'SELECT COUNT(*) as cnt FROM replenishment_requests WHERE status = $1 AND "storeId" = $2',
        [status, storeId]
      )
    : await pool.query(
        'SELECT COUNT(*) as cnt FROM replenishment_requests WHERE status = $1',
        [status]
      );
  return Number(rows[0].cnt);
}
