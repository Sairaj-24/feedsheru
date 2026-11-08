# Hosting FeedSheru

FeedSheru is open source so a neighbourhood, NGO, or city group can run **their own instance**. You do not need Neon specifically — any Postgres works.

Pick one path:

| Path | Best for | Effort |
| --- | --- | --- |
| **A. Vercel + Neon** | Fast public pilot, no servers to manage | ~15 minutes |
| **B. Docker Compose** | Self-host on a laptop, VPS, or local machine | One command after Docker is installed |

---

## Shared requirements

Every deploy needs:

1. **`AUTH_SECRET`** — long random string (signs session cookies)

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **`DATABASE_URL`** — Postgres connection string  
3. **Schema** — run migrations once (`npm run db:migrate` or automatic in Docker)

Optional:

- **`DATABASE_URL_UNPOOLED`** — prefer this for migrations on Neon (direct host, not the pooler)
- **`DATABASE_DRIVER=neon|pg`** — override auto-detect (`*.neon.tech` → Neon driver, otherwise `pg`)

Session cookies: in production they are **Secure** (HTTPS only). Docker Compose defaults `AUTH_COOKIE_SECURE=false` so `http://localhost:3000` can keep you signed in. Set `AUTH_COOKIE_SECURE=true` when you put the app behind HTTPS.

---

## Path A — Vercel + Neon (hosted pilot)

### 1. Database

1. Create a free project at [neon.com](https://neon.com/)
2. Copy the **pooled** connection string → `DATABASE_URL`
3. Copy the **direct** connection string → `DATABASE_URL_UNPOOLED`

### 2. Deploy the app

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSairaj-24%2Ffeedsheru&env=AUTH_SECRET,DATABASE_URL,DATABASE_URL_UNPOOLED&envDescription=Session%20secret%20and%20Neon%20Postgres%20URLs&project-name=feedsheru&repository-name=feedsheru)

Or manually:

1. Import `Sairaj-24/feedsheru` into Vercel
2. Set environment variables:
   - `AUTH_SECRET`
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
3. Deploy

### 3. Run migrations

From your laptop (with the same env vars):

```bash
npm install
npm run db:migrate
```

Or set the vars in a one-off shell against Neon and run `npm run db:migrate` once per database.

Open your Vercel URL and create an account.

---

## Path B — Docker Compose (self-host)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose

### Start

```bash
git clone https://github.com/Sairaj-24/feedsheru.git
cd feedsheru
cp .env.docker.example .env
```

Edit `.env` and set a real `AUTH_SECRET`, then:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

The `web` container waits for Postgres, runs migrations, then starts Next.js.

### Useful commands

```bash
docker compose logs -f web
docker compose down          # stop
docker compose down -v       # stop and delete DB volume
```

### Exposing to your neighbourhood

- Put the app behind HTTPS (Caddy, nginx, Cloudflare Tunnel, etc.) and set `AUTH_COOKIE_SECURE=true`
- Change default `POSTGRES_PASSWORD` in `.env` before any public exposure — Compose builds `DATABASE_URL` from `POSTGRES_*`, so you do not also edit a URL
- Keep `.env` off git and backups that are shared casually

---

## Local development (without Docker)

```bash
cp .env.example .env.local
# set AUTH_SECRET + DATABASE_URL (Neon or local Postgres)
npm install
npm run db:migrate   # or: npm run db:push
npm run db:seed      # optional: demo users + sample listings
npm run dev
```

- Neon URLs are auto-detected (`*.neon.tech`)
- Any other Postgres URL uses the standard `pg` driver

### Demo seed

After schema is applied (`db:migrate` or `db:push`):

```bash
npm run db:seed
# optional hard refresh of demo sessions + listings:
npm run db:seed -- --reset
```

Demo logins (password `Demo123!` for all):

| Email | Role |
| --- | --- |
| `provider@demo.test` | Provider |
| `maker@demo.test` | Maker |
| `distributor@demo.test` | Distributor |

Re-running upserts those users by email and replaces the demo provider’s listings (open kitchen, ready kitchen, open ready-to-feed) plus a few `listing_events`. See `scripts/seed.ts`.

---

## Checklist before you invite helpers

- [ ] `AUTH_SECRET` is unique and not the example value
- [ ] Migrations have been applied
- [ ] You can sign up and reach `/onboarding`
- [ ] HTTPS is on if this is a real deployment
- [ ] Someone in the group knows how to pull updates / restart Compose

---

## What hosting does *not* solve

Software can be one-click. The feeding network still needs Providers, Makers, and Distributors in that place. Host the tool, then recruit your street — open source spreads the **code**, not the volunteers.
