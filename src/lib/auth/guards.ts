import { redirect } from "next/navigation";

import type { User } from "@/db/schema";

import type { PrimaryRole } from "./roles";
import { getCurrentUser } from "./session";

/**
 * Require a signed-in user. Redirects unauthenticated visitors to `/`.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  return user;
}

/**
 * Require a signed-in user with the given primary role.
 * - No session → `/`
 * - No role yet → `/onboarding`
 * - Wrong role → `/home`
 */
export async function requireRole(role: PrimaryRole): Promise<User> {
  const user = await requireUser();
  if (!user.primaryRole) {
    redirect("/onboarding");
  }
  if (user.primaryRole !== role) {
    redirect("/home");
  }
  return user;
}

/**
 * Require a signed-in user who has already chosen a primary role.
 * - No session → `/`
 * - No role → `/onboarding`
 */
export async function requireOnboardedUser(): Promise<User & { primaryRole: PrimaryRole }> {
  const user = await requireUser();
  if (!user.primaryRole) {
    redirect("/onboarding");
  }
  return user as User & { primaryRole: PrimaryRole };
}
