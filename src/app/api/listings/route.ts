import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  listingEvents,
  listings,
  type ListingPath,
  type User,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const QUANTITY_LABELS = new Set(["Small", "Medium", "Large"]);
const LISTING_PATHS = new Set<ListingPath>(["needs_kitchen", "ready_to_feed"]);

type ProviderAuth =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

async function requireProviderApi(): Promise<ProviderAuth> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }
  if (!user.primaryRole) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Complete onboarding first." },
        { status: 403 },
      ),
    };
  }
  if (user.primaryRole !== "provider") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Providers only." }, { status: 403 }),
    };
  }
  return { ok: true, user };
}

function parseDate(value: unknown, label: string): Date | { error: string } {
  if (typeof value !== "string" || !value.trim()) {
    return { error: `${label} is required.` };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: `${label} is invalid.` };
  }
  return date;
}

/** List the signed-in provider's listings (newest first). */
export async function GET() {
  try {
    const auth = await requireProviderApi();
    if (!auth.ok) {
      return auth.response;
    }
    const { user } = auth;

    const rows = await db
      .select()
      .from(listings)
      .where(eq(listings.providerUserId, user.id))
      .orderBy(desc(listings.createdAt));

    return NextResponse.json({ listings: rows });
  } catch {
    return NextResponse.json(
      { error: "Unable to load listings." },
      { status: 500 },
    );
  }
}

/** Create a surplus listing for the signed-in provider. */
export async function POST(request: Request) {
  try {
    const auth = await requireProviderApi();
    if (!auth.ok) {
      return auth.response;
    }
    const { user } = auth;

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      quantityLabel?: unknown;
      cityArea?: unknown;
      pickupAddress?: unknown;
      pickupWindowStart?: unknown;
      pickupWindowEnd?: unknown;
      path?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const descriptionRaw =
      typeof body.description === "string" ? body.description.trim() : "";
    const description = descriptionRaw || null;

    if (
      typeof body.quantityLabel !== "string" ||
      !QUANTITY_LABELS.has(body.quantityLabel)
    ) {
      return NextResponse.json(
        { error: "Choose Small, Medium, or Large." },
        { status: 400 },
      );
    }
    const quantityLabel = body.quantityLabel;

    const cityArea =
      typeof body.cityArea === "string" ? body.cityArea.trim() : "";
    if (!cityArea) {
      return NextResponse.json(
        { error: "City / area is required." },
        { status: 400 },
      );
    }

    const pickupAddress =
      typeof body.pickupAddress === "string" ? body.pickupAddress.trim() : "";
    if (!pickupAddress) {
      return NextResponse.json(
        { error: "Pickup address is required." },
        { status: 400 },
      );
    }

    const pickupWindowStart = parseDate(
      body.pickupWindowStart,
      "Pickup window start",
    );
    if ("error" in pickupWindowStart) {
      return NextResponse.json(
        { error: pickupWindowStart.error },
        { status: 400 },
      );
    }

    const pickupWindowEnd = parseDate(
      body.pickupWindowEnd,
      "Pickup window end",
    );
    if ("error" in pickupWindowEnd) {
      return NextResponse.json(
        { error: pickupWindowEnd.error },
        { status: 400 },
      );
    }

    if (pickupWindowEnd.getTime() <= pickupWindowStart.getTime()) {
      return NextResponse.json(
        { error: "Pickup window end must be after start." },
        { status: 400 },
      );
    }

    if (
      typeof body.path !== "string" ||
      !LISTING_PATHS.has(body.path as ListingPath)
    ) {
      return NextResponse.json(
        { error: "Choose needs kitchen or ready to feed." },
        { status: 400 },
      );
    }
    const path = body.path as ListingPath;

    const now = new Date();

    const listing = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(listings)
        .values({
          providerUserId: user.id,
          title,
          description,
          quantityLabel,
          cityArea,
          pickupAddress,
          pickupWindowStart,
          pickupWindowEnd,
          path,
          status: "open",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(listingEvents).values({
        listingId: created.id,
        actorUserId: user.id,
        fromStatus: null,
        toStatus: "open",
        note: "Listing published",
        createdAt: now,
      });

      return created;
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create listing." },
      { status: 500 },
    );
  }
}
