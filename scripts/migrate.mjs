import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import dns from "node:dns";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, "../drizzle");

function normalizeDatabaseUrl(raw) {
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

function installNeonDohDns() {
  if (process.env.NEON_DNS_DOH === "0") return;
  const originalLookup = dns.lookup.bind(dns);
  const cache = new Map();

  dns.lookup = (hostname, options, callback) => {
    let opts = options;
    let cb = callback;
    if (typeof options === "function") {
      cb = options;
      opts = undefined;
    }
    if (!cb) {
      return opts === undefined
        ? originalLookup(hostname)
        : originalLookup(hostname, opts);
    }
    if (!/(^|\.)neon\.tech$/i.test(hostname)) {
      return opts === undefined
        ? originalLookup(hostname, cb)
        : originalLookup(hostname, opts, cb);
    }
    const wantAll =
      typeof opts === "object" && opts !== null && Boolean(opts.all);
    const cached = cache.get(hostname);
    const lookup = cached && cached.expiresAt > Date.now()
      ? Promise.resolve(cached.address)
      : fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
          { headers: { accept: "application/dns-json" } },
        ).then(async (response) => {
          if (!response.ok) {
            throw new Error(`DoH lookup failed: HTTP ${response.status}`);
          }
          const payload = await response.json();
          const record = payload.Answer?.find((answer) => answer.type === 1);
          if (!record?.data) {
            throw new Error(`DoH lookup returned no A record for ${hostname}`);
          }
          const ttlMs = Math.max((record.TTL ?? 60) * 1000, 30_000);
          cache.set(hostname, {
            address: record.data,
            expiresAt: Date.now() + ttlMs,
          });
          return record.data;
        });
    void lookup
      .then((address) => {
        if (wantAll) {
          cb(null, [{ address, family: 4 }]);
          return;
        }
        cb(null, address, 4);
      })
      .catch((error) => cb(error, "", 4));
  };
}

function getMigrationUrl() {
  const raw =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
  if (!raw) {
    throw new Error(
      "DATABASE_URL (or DATABASE_URL_UNPOOLED) is required to run migrations.",
    );
  }
  return normalizeDatabaseUrl(raw);
}

const connectionString = getMigrationUrl();
if (/(^|\.)neon\.tech$/i.test(new URL(connectionString).hostname)) {
  installNeonDohDns();
}
const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

console.log("Running database migrations…");
await migrate(db, { migrationsFolder });
await pool.end();
console.log("Migrations complete.");
