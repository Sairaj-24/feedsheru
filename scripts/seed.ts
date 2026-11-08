/**
 * FeedSheru local demo seed
 *
 * Demo accounts (password for all: Demo123!):
 *   - provider@demo.test     → primaryRole provider
 *   - maker@demo.test        → primaryRole maker
 *   - distributor@demo.test  → primaryRole distributor
 *
 * Creates sample listings (open / ready / ready_to_feed open) and listing_events.
 * Re-runs upsert users by email and replace that provider's demo listings.
 *
 * Usage:
 *   npm run db:seed
 *   npm run db:seed -- --reset   # also wipe demo users' sessions, then reseed
 *
 * Requires DATABASE_URL (or DATABASE_URL_UNPOOLED). Loads .env.local / .env if present.
 * No real PII — @demo.test addresses only.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { eq, inArray } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";

import { hashPassword } from "../src/lib/auth/password";
import { installNeonDohDns } from "../src/db/neon-dns";
import * as schema from "../src/db/schema";
import {
  listingEvents,
  listings,
  sessions,
  users,
  type ListingStatus,
} from "../src/db/schema";

const DEMO_PASSWORD = "Demo123!";
const DEMO_CITY = "Demo Ward";

type DemoRole = "provider" | "maker" | "distributor";
type AppDatabase =
  | NeonDatabase<typeof schema>
  | NodePgDatabase<typeof schema>;

const DEMO_USERS: ReadonlyArray<{
  email: string;
  primaryRole: DemoRole;
  displayName: string;
}> = [
  {
    email: "provider@demo.test",
    primaryRole: "provider",
    displayName: "Demo Provider",
  },
  {
    email: "maker@demo.test",
    primaryRole: "maker",
    displayName: "Demo Maker",
  },
  {
    email: "distributor@demo.test",
    primaryRole: "distributor",
    displayName: "Demo Distributor",
  },
];

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function normalizeDatabaseUrl(raw: string) {
  let url = raw.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }
  const parsed = new URL(url);
  parsed.searchParams.delete("channel_binding");
  return parsed.toString();
}

function getDatabaseUrl() {
  const raw =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
  if (!raw) {
    throw new Error(
      "DATABASE_URL (or DATABASE_URL_UNPOOLED) is required to seed. Copy .env.example to .env.local.",
    );
  }
  return normalizeDatabaseUrl(raw);
}

function isNeonHost(connectionString: string) {
  try {
    return /(^|\.)neon\.tech$/i.test(new URL(connectionString).hostname);
  } catch {
    return false;
  }
}

function resolveDriver(connectionString: string): "neon" | "pg" {
  const override = process.env.DATABASE_DRIVER?.trim().toLowerCase();
  if (override === "neon" || override === "pg") {
    return override;
  }
  return isNeonHost(connectionString) ? "neon" : "pg";
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function parseArgs(argv: string[]) {
  return {
    reset: argv.includes("--reset"),
  };
}

async function upsertDemoUsers(db: AppDatabase, passwordHash: string) {
  const byRole: Record<DemoRole, string> = {
    provider: "",
    maker: "",
    distributor: "",
  };

  for (const demo of DEMO_USERS) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, demo.email))
      .limit(1);

    const now = new Date();

    if (existing[0]) {
      await db
        .update(users)
        .set({
          passwordHash,
          displayName: demo.displayName,
          cityArea: DEMO_CITY,
          primaryRole: demo.primaryRole,
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: now,
        })
        .where(eq(users.id, existing[0].id));
      byRole[demo.primaryRole] = existing[0].id;
    } else {
      const inserted = await db
        .insert(users)
        .values({
          email: demo.email,
          passwordHash,
          displayName: demo.displayName,
          cityArea: DEMO_CITY,
          primaryRole: demo.primaryRole,
        })
        .returning({ id: users.id });
      byRole[demo.primaryRole] = inserted[0]!.id;
    }
  }

  return byRole;
}

async function clearDemoListings(db: AppDatabase, providerUserId: string) {
  // listing_events + feed_logs cascade from listings
  await db.delete(listings).where(eq(listings.providerUserId, providerUserId));
}

async function clearDemoSessions(db: AppDatabase, userIds: string[]) {
  if (userIds.length === 0) return;
  await db.delete(sessions).where(inArray(sessions.userId, userIds));
}

async function insertEvent(
  db: AppDatabase,
  row: {
    listingId: string;
    actorUserId: string;
    fromStatus: ListingStatus | null;
    toStatus: ListingStatus;
    note?: string;
    createdAt: Date;
  },
) {
  await db.insert(listingEvents).values(row);
}

async function seedListings(
  db: AppDatabase,
  ids: Record<DemoRole, string>,
) {
  const now = new Date();
  const windowStart = hoursFromNow(2);
  const windowEnd = hoursFromNow(6);

  // 1) Open kitchen job — Maker can claim
  const [openKitchen] = await db
    .insert(listings)
    .values({
      providerUserId: ids.provider,
      title: "Surplus rice & sabzi (demo)",
      description:
        "[demo-seed] Leftover cooked rice and veg stew. Needs kitchen check before feeding.",
      quantityLabel: "Medium",
      cityArea: DEMO_CITY,
      pickupAddress: "12 Demo Lane, near the park gate",
      pickupWindowStart: windowStart,
      pickupWindowEnd: windowEnd,
      path: "needs_kitchen",
      status: "open",
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: listings.id });

  await insertEvent(db, {
    listingId: openKitchen!.id,
    actorUserId: ids.provider,
    fromStatus: null,
    toStatus: "open",
    note: "Listing published (demo seed)",
    createdAt: now,
  });

  // 2) Ready kitchen job — Distributor can claim
  const readyAt = new Date(now.getTime() + 60_000);
  const [readyKitchen] = await db
    .insert(listings)
    .values({
      providerUserId: ids.provider,
      title: "Wedding leftover parcels (demo)",
      description:
        "[demo-seed] Maker already portioned into safe trays. Ready for street run.",
      quantityLabel: "Large",
      cityArea: DEMO_CITY,
      pickupAddress: "Demo Community Hall kitchen exit",
      pickupWindowStart: windowStart,
      pickupWindowEnd: windowEnd,
      path: "needs_kitchen",
      status: "ready",
      makerUserId: ids.maker,
      createdAt: now,
      updatedAt: readyAt,
    })
    .returning({ id: listings.id });

  await insertEvent(db, {
    listingId: readyKitchen!.id,
    actorUserId: ids.provider,
    fromStatus: null,
    toStatus: "open",
    note: "Listing published (demo seed)",
    createdAt: now,
  });
  await insertEvent(db, {
    listingId: readyKitchen!.id,
    actorUserId: ids.maker,
    fromStatus: "open",
    toStatus: "claimed_by_maker",
    note: "Claimed for kitchen prep (demo seed)",
    createdAt: new Date(now.getTime() + 30_000),
  });
  await insertEvent(db, {
    listingId: readyKitchen!.id,
    actorUserId: ids.maker,
    fromStatus: "claimed_by_maker",
    toStatus: "ready",
    note: "Portions packed — ready to feed (demo seed)",
    createdAt: readyAt,
  });

  // 3) Open ready_to_feed — Distributor direct path (skip Maker)
  const [directFeed] = await db
    .insert(listings)
    .values({
      providerUserId: ids.provider,
      title: "Sealed dog-safe packs (demo)",
      description:
        "[demo-seed] Already animal-safe and sealed. Distributor can claim directly.",
      quantityLabel: "Small",
      cityArea: DEMO_CITY,
      pickupAddress: "Demo Cafe back alley pickup shelf",
      pickupWindowStart: windowStart,
      pickupWindowEnd: windowEnd,
      path: "ready_to_feed",
      status: "open",
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: listings.id });

  await insertEvent(db, {
    listingId: directFeed!.id,
    actorUserId: ids.provider,
    fromStatus: null,
    toStatus: "open",
    note: "Ready-to-feed listing published (demo seed)",
    createdAt: now,
  });
}

async function main() {
  loadEnvFiles();
  const { reset } = parseArgs(process.argv.slice(2));
  const connectionString = getDatabaseUrl();
  const driver = resolveDriver(connectionString);

  let db: AppDatabase;
  let end: () => Promise<void>;

  if (isNeonHost(connectionString)) {
    installNeonDohDns();
  }

  if (driver === "neon") {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString });
    db = drizzleNeon(pool, { schema });
    end = async () => {
      await pool.end();
    };
  } else {
    const pool = new PgPool({ connectionString });
    db = drizzlePg(pool, { schema });
    end = async () => {
      await pool.end();
    };
  }

  try {
    console.log(`Seeding FeedSheru demo data (${driver})…`);
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const ids = await upsertDemoUsers(db, passwordHash);

    if (reset) {
      console.log("--reset: clearing demo sessions…");
      await clearDemoSessions(db, Object.values(ids));
    }

    await clearDemoListings(db, ids.provider);
    await seedListings(db, ids);

    console.log("Demo users (password documented in scripts/seed.ts header):");
    for (const demo of DEMO_USERS) {
      console.log(`  - ${demo.email} (${demo.primaryRole})`);
    }
    console.log(
      "Listings: 1 open needs_kitchen, 1 ready needs_kitchen, 1 open ready_to_feed.",
    );
    console.log("Seed complete.");
  } finally {
    await end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  if (err instanceof Error && err.cause) {
    console.error(err.cause);
  }
  process.exit(1);
});
