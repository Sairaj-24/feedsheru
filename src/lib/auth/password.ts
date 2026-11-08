import bcrypt from "bcryptjs";

import { MIN_PASSWORD_LENGTH } from "./constants";

const SALT_ROUNDS = 12;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
