import dns from "node:dns";

const originalLookup: typeof dns.lookup = dns.lookup.bind(dns);
const cache = new Map<string, { address: string; expiresAt: number }>();

function isNeonHost(hostname: string) {
  return /(^|\.)neon\.tech$/i.test(hostname);
}

async function resolveNeonIpv4(hostname: string): Promise<string> {
  const cached = cache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.address;
  }

  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
    { headers: { accept: "application/dns-json" } },
  );

  if (!response.ok) {
    throw new Error(`DoH lookup failed for ${hostname}: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    Answer?: Array<{ type: number; data: string; TTL?: number }>;
  };

  const record = payload.Answer?.find((answer) => answer.type === 1);
  if (!record?.data) {
    throw new Error(`DoH lookup returned no A record for ${hostname}`);
  }

  const ttlMs = Math.max((record.TTL ?? 60) * 1000, 30_000);
  cache.set(hostname, { address: record.data, expiresAt: Date.now() + ttlMs });
  return record.data;
}

let installed = false;

/** Twingate/corporate DNS often refuses *.neon.tech — use DoH for those hosts. */
export function installNeonDohDns() {
  if (installed || process.env.NEON_DNS_DOH === "0") return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dns as any).lookup = (
    hostname: string,
    options: unknown,
    callback?: unknown,
  ) => {
    let opts = options;
    let cb = callback as
      | ((
          err: NodeJS.ErrnoException | null,
          address: string | dns.LookupAddress[],
          family?: number,
        ) => void)
      | undefined;

    if (typeof options === "function") {
      cb = options as typeof cb;
      opts = undefined;
    }

    if (!cb) {
      if (opts === undefined) {
        return originalLookup(hostname);
      }
      return originalLookup(hostname, opts as never);
    }

    if (!isNeonHost(hostname)) {
      if (opts === undefined) {
        return originalLookup(hostname, cb as never);
      }
      return originalLookup(hostname, opts as never, cb as never);
    }

    const wantAll =
      typeof opts === "object" &&
      opts !== null &&
      "all" in opts &&
      Boolean((opts as { all?: boolean }).all);

    void resolveNeonIpv4(hostname)
      .then((address) => {
        if (wantAll) {
          cb(null, [{ address, family: 4 }]);
          return;
        }
        cb(null, address, 4);
      })
      .catch((error: NodeJS.ErrnoException) => {
        cb(error, "", 4);
      });
  };

  installed = true;
}
