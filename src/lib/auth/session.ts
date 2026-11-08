import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

import { SESSION_COOKIE, SESSION_DAYS, getAuthSecret } from "./constants";

function hashToken(token: string) {
  return createHash("sha256")
    .update(`${token}:${getAuthSecret()}`)
    .digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    createdAt: now,
  });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function getUserFromSessionToken(
  token: string,
): Promise<User | null> {
  const now = new Date();
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, now)),
    )
    .limit(1);

  return rows[0]?.user ?? null;
}

export async function getSessionTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;
  return getUserFromSessionToken(token);
}
