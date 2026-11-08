import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { listingEvents, listings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(
  request: Request,
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

    let note: string | null = null;
    try {
      const body = (await request.json()) as { note?: unknown };
      if (typeof body.note === "string") {
        const trimmed = body.note.trim();
        note = trimmed ? trimmed.slice(0, 500) : null;
      }
    } catch {
      // empty body is fine — note stays null
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
    if (existing.makerUserId !== user.id) {
      return NextResponse.json(
        { error: "You did not claim this listing." },
        { status: 403 },
      );
    }
    if (existing.status !== "claimed_by_maker") {
      return NextResponse.json(
        { error: "Listing is not waiting to be marked ready." },
        { status: 409 },
      );
    }

    const now = new Date();

    try {
      const readyListing = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(listings)
          .set({
            status: "ready",
            updatedAt: now,
          })
          .where(
            and(
              eq(listings.id, id),
              eq(listings.status, "claimed_by_maker"),
              eq(listings.makerUserId, user.id),
            ),
          )
          .returning();

        if (!updated) {
          throw new Error("READY_RACE");
        }

        await tx.insert(listingEvents).values({
          listingId: updated.id,
          actorUserId: user.id,
          fromStatus: "claimed_by_maker",
          toStatus: "ready",
          note,
          createdAt: now,
        });

        return updated;
      });

      return NextResponse.json({ listing: readyListing });
    } catch (error) {
      if (error instanceof Error && error.message === "READY_RACE") {
        return NextResponse.json(
          { error: "Listing could not be marked ready." },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch {
    return NextResponse.json(
      { error: "Unable to mark listing ready." },
      { status: 500 },
    );
  }
}
