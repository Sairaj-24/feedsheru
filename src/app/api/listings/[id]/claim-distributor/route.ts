import { and, eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { listingEvents, listings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    if (!user.primaryRole) {
      return NextResponse.json(
        { error: "Complete onboarding first." },
        { status: 403 },
      );
    }
    if (user.primaryRole !== "distributor") {
      return NextResponse.json(
        { error: "Distributors only." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
    }

    const now = new Date();
    const claimableWhere = or(
      eq(listings.status, "ready"),
      and(eq(listings.status, "open"), eq(listings.path, "ready_to_feed")),
    );

    const outcome = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(listings)
        .where(eq(listings.id, id))
        .limit(1);

      if (!current) {
        return { kind: "not_found" as const };
      }

      const isClaimable =
        current.status === "ready" ||
        (current.status === "open" && current.path === "ready_to_feed");

      if (!isClaimable || current.distributorUserId) {
        return { kind: "conflict" as const };
      }

      const [updated] = await tx
        .update(listings)
        .set({
          status: "claimed_by_distributor",
          distributorUserId: user.id,
          updatedAt: now,
        })
        .where(
          and(
            eq(listings.id, id),
            claimableWhere,
            isNull(listings.distributorUserId),
          ),
        )
        .returning();

      if (!updated) {
        return { kind: "conflict" as const };
      }

      await tx.insert(listingEvents).values({
        listingId: updated.id,
        actorUserId: user.id,
        fromStatus: current.status,
        toStatus: "claimed_by_distributor",
        note: "Claimed for distribution",
        createdAt: now,
      });

      return { kind: "ok" as const, listing: updated };
    });

    if (outcome.kind === "not_found") {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (outcome.kind === "conflict") {
      return NextResponse.json(
        { error: "This job is no longer available to claim." },
        { status: 409 },
      );
    }

    return NextResponse.json({ listing: outcome.listing });
  } catch {
    return NextResponse.json(
      { error: "Unable to claim listing." },
      { status: 500 },
    );
  }
}
