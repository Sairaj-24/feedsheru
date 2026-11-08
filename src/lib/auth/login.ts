import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

import {
  LOCK_MINUTES,
  MAX_FAILED_ATTEMPTS,
} from "./constants";
import { normalizeEmail, verifyPassword } from "./password";
import { createSession } from "./session";

export type AuthResult =
  | { ok: true; userId: string; email: string; token: string; expiresAt: Date }
  | { ok: false; error: string; status: number; lockedUntil?: string };

export async function loginWithPassword(
  rawEmail: string,
  password: string,
): Promise<AuthResult> {
  const email = normalizeEmail(rawEmail);
  if (!email || !password) {
    return { ok: false, error: "Email and password are required.", status: 400 };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { ok: false, error: "Invalid email or password.", status: 401 };
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    return {
      ok: false,
      error: `Too many failed attempts. Try again after ${user.lockedUntil.toLocaleString()}.`,
      status: 423,
      lockedUntil: user.lockedUntil.toISOString(),
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failedAttempts = user.failedAttempts + 1;
    const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
      : null;

    await db
      .update(users)
      .set({
        failedAttempts: shouldLock ? 0 : failedAttempts,
        lockedUntil,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    if (shouldLock) {
      return {
        ok: false,
        error: `Account locked for ${LOCK_MINUTES} minutes after too many failed attempts.`,
        status: 423,
        lockedUntil: lockedUntil!.toISOString(),
      };
    }

    const remaining = MAX_FAILED_ATTEMPTS - failedAttempts;
    return {
      ok: false,
      error: `Invalid email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
      status: 401,
    };
  }

  await db
    .update(users)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  const session = await createSession(user.id);

  return {
    ok: true,
    userId: user.id,
    email: user.email,
    token: session.token,
    expiresAt: session.expiresAt,
  };
}
