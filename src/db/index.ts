import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";

import { installNeonDohDns } from "./neon-dns";
import * as schema from "./schema";

type AppDatabase =
  | NeonDatabase<typeof schema>
  | NodePgDatabase<typeof schema>;

export function normalizeDatabaseUrl(raw: string) {
  let url = raw.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }

  const parsed = new URL(url);
  // neon serverless / some drivers reject this extra param from `neon env pull`
  parsed.searchParams.delete("channel_binding");
  return parsed.toString();
}

export function getDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local (or see docs/HOSTING.md).",
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

function createDb(): AppDatabase {
  const connectionString = getDatabaseUrl();
  const driver = resolveDriver(connectionString);

  // DoH is about reaching *.neon.tech, not which SQL driver is used.
  if (isNeonHost(connectionString)) {
    installNeonDohDns();
  }

  if (driver === "neon") {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString });
    return drizzleNeon(pool, { schema });
  }

  const pool = new PgPool({ connectionString });
  return drizzlePg(pool, { schema });
}

let _db: AppDatabase | undefined;

function getDb(): AppDatabase {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

/** Lazy so `next build` / Docker image builds work without DATABASE_URL. */
export const db = new Proxy({} as AppDatabase, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has(_target, prop) {
    return Reflect.has(getDb() as object, prop);
  },
});
