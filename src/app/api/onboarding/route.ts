import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { isPrimaryRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    if (user.primaryRole) {
      return NextResponse.json(
        { error: "Role already chosen.", primaryRole: user.primaryRole },
        { status: 409 },
      );
    }

    const body = (await request.json()) as {
      primaryRole?: unknown;
      displayName?: unknown;
      cityArea?: unknown;
    };

    if (!isPrimaryRole(body.primaryRole)) {
      return NextResponse.json(
        { error: "Choose Provider, Maker, or Distributor." },
        { status: 400 },
      );
    }

    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const cityArea =
      typeof body.cityArea === "string" ? body.cityArea.trim() : "";

    const now = new Date();
    const [updated] = await db
      .update(users)
      .set({
        primaryRole: body.primaryRole,
        displayName: displayName || null,
        cityArea: cityArea || null,
        updatedAt: now,
      })
      .where(and(eq(users.id, user.id), isNull(users.primaryRole)))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        cityArea: users.cityArea,
        primaryRole: users.primaryRole,
      });

    if (!updated) {
      return NextResponse.json(
        { error: "Role already chosen.", primaryRole: user.primaryRole },
        { status: 409 },
      );
    }

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json(
      { error: "Unable to save onboarding." },
      { status: 500 },
    );
  }
}
