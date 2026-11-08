import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { feedLogs, listingEvents, listings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

    const body = (await request.json()) as {
      quantityLabel?: unknown;
      animalsApprox?: unknown;
      placeLabel?: unknown;
      notes?: unknown;
    };

    const quantityLabel =
      typeof body.quantityLabel === "string" ? body.quantityLabel.trim() : "";
    const placeLabel =
      typeof body.placeLabel === "string" ? body.placeLabel.trim() : "";
    const notesRaw = typeof body.notes === "string" ? body.notes.trim() : "";
    const animalsApprox =
      typeof body.animalsApprox === "number"
        ? body.animalsApprox
        : typeof body.animalsApprox === "string"
          ? Number.parseInt(body.animalsApprox, 10)
          : NaN;

    if (
      quantityLabel !== "Small" &&
      quantityLabel !== "Medium" &&
      quantityLabel !== "Large"
    ) {
      return NextResponse.json(
        { error: "Choose Small, Medium, or Large." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(animalsApprox) || animalsApprox < 1) {
      return NextResponse.json(
        { error: "Enter an approximate animal count (1 or more)." },
        { status: 400 },
      );
    }
    if (!placeLabel) {
      return NextResponse.json(
        { error: "Place / area is required." },
        { status: 400 },
      );
    }

    const now = new Date();

    const outcome = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(listings)
        .set({
          status: "fed",
          updatedAt: now,
        })
        .where(
          and(
            eq(listings.id, id),
            eq(listings.status, "claimed_by_distributor"),
            eq(listings.distributorUserId, user.id),
          ),
        )
        .returning();

      if (!updated) {
        const [existing] = await tx
          .select({ id: listings.id, status: listings.status })
          .from(listings)
          .where(eq(listings.id, id))
          .limit(1);

        if (!existing) {
          return { kind: "not_found" as const };
        }
        return { kind: "conflict" as const };
      }

      const [feedLog] = await tx
        .insert(feedLogs)
        .values({
          listingId: updated.id,
          distributorUserId: user.id,
          quantityLabel,
          animalsApprox,
          placeLabel,
          notes: notesRaw || null,
          createdAt: now,
        })
        .returning();

      await tx.insert(listingEvents).values({
        listingId: updated.id,
        actorUserId: user.id,
        fromStatus: "claimed_by_distributor",
        toStatus: "fed",
        note: `Fed ~${animalsApprox} at ${placeLabel}`,
        createdAt: now,
      });

      return { kind: "ok" as const, listing: updated, feedLog };
    });

    if (outcome.kind === "not_found") {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (outcome.kind === "conflict") {
      return NextResponse.json(
        { error: "This job is not yours to log, or already fed." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      listing: outcome.listing,
      feedLog: outcome.feedLog,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to save feed log." },
      { status: 500 },
    );
  }
}
