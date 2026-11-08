import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function normalizeDatabaseUrl(raw: string) {
  let url = raw.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }

  // neon() HTTP driver rejects some query params Neon CLI may include
  const parsed = new URL(url);
  parsed.searchParams.delete("channel_binding");
  return parsed.toString();
}

function getDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Run `neon env pull` or copy it from the Neon console.",
    );
  }
  return normalizeDatabaseUrl(raw);
}

const sql = neon(getDatabaseUrl());

export const db = drizzle({ client: sql, schema });
