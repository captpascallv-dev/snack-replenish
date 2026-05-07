import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "snack-replenish-dev-secret";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: "OWNER" | "PARTNER" | "STORE_MANAGER";
  storeId: string | null;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const [payload, sig] = token.split(".");
    if (sign(payload) !== sig) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  (await cookies()).set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const c = (await cookies()).get("session");
  if (!c) return null;
  return verifyToken(c.value);
}

export async function clearSession() {
  (await cookies()).set("session", "", { maxAge: 0, path: "/" });
}
