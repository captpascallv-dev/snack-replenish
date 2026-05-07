import { cookies } from "next/headers";
import { verifyLogin, getUserById, type User } from "./db";

const SESSION_KEY = "snack_user_id";

export async function login(email: string, password: string): Promise<User | null> {
  const user = verifyLogin(email, password);
  if (!user) return null;
  const c = await cookies();
  c.set(SESSION_KEY, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return user;
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_KEY);
}

export async function getSession(): Promise<User | null> {
  const c = await cookies();
  const userId = c.get(SESSION_KEY)?.value;
  if (!userId) return null;
  return getUserById(userId) ?? null;
}
