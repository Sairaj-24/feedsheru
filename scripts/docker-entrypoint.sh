#!/bin/sh
set -eu

echo "Waiting for database…"
node <<'NODE'
const { setTimeout } = require("node:timers/promises");
const pg = require("pg");

function normalize(raw) {
  let url = String(raw).trim();
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

const raw =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!String(raw).trim()) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const connectionString = normalize(raw);

async function main() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const client = new pg.Client({ connectionString });
    try {
      await client.connect();
      await client.query("select 1");
      await client.end();
      console.log("Database is ready.");
      return;
    } catch (error) {
      try {
        await client.end();
      } catch {
        // ignore close errors while waiting
      }
      console.log(`Database not ready yet: ${error.message}`);
      await setTimeout(1500);
    }
  }
  console.error("Timed out waiting for database.");
  process.exit(1);
}

main();
NODE

node ./scripts/migrate.mjs
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
