import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { listingEvents, listings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
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
    if (user.primaryRole !== "maker") {
      return NextResponse.json({ error: "Makers only." }, { status: 403 });
    }

    const { id } = await context.params;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
    }

    const [existing] = await db
      .select({
        id: listings.id,
        status: listings.status,
        path: listings.path,
        makerUserId: listings.makerUserId,
      })
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (existing.path !== "needs_kitchen") {
      return NextResponse.json(
        { error: "This listing does not need a kitchen." },
        { status: 409 },
      );
    }
    if (existing.status !== "open") {
      return NextResponse.json(
        { error: "Listing is no longer open to claim." },
        { status: 409 },
      );
    }

    const now = new Date();

    try {
      const claimed = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(listings)
          .set({
            status: "claimed_by_maker",
            makerUserId: user.id,
            updatedAt: now,
          })
          .where(
            and(
              eq(listings.id, id),
              eq(listings.status, "open"),
              eq(listings.path, "needs_kitchen"),
            ),
          )
          .returning();

        if (!updated) {
          throw new Error("CLAIM_RACE");
        }

        await tx.insert(listingEvents).values({
          listingId: updated.id,
          actorUserId: user.id,
          fromStatus: "open",
          toStatus: "claimed_by_maker",
          note: null,
          createdAt: now,
        });

        return updated;
      });

      return NextResponse.json({ listing: claimed });
    } catch (error) {
      if (error instanceof Error && error.message === "CLAIM_RACE") {
        return NextResponse.json(
          { error: "Another maker already claimed this listing." },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch {
    return NextResponse.json(
      { error: "Unable to claim listing." },
      { status: 500 },
    );
  }
}
