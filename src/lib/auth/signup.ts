import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

import { hashPassword, normalizeEmail, validatePassword } from "./password";
import { createSession } from "./session";

import type { AuthResult } from "./login";

export async function signupWithPassword(
  rawEmail: string,
  password: string,
): Promise<AuthResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { ok: false, error: "Email is required.", status: 400 };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, error: passwordError, status: 400 };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return {
      ok: false,
      error: "An account with this email already exists.",
      status: 409,
    };
  }

  const now = new Date();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const session = await createSession(userId);

  return {
    ok: true,
    userId,
    email,
    token: session.token,
    expiresAt: session.expiresAt,
  };
}
