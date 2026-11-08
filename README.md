# FeedSheru

**Sheru is a street dog that needs your help.**

FeedSheru is a mobile-first web app that turns leftover food into meals for street dogs. It connects people who have surplus food with people who can prepare it safely and people who can take it to the streets — so less food is wasted and more community dogs get fed.

> Open source. Built for neighbourhood pilots in India first, then anywhere the same problem exists.

---

## The problem

Every day, restaurants, stalls, and homes throw away edible food while street dogs go hungry. Today that gap is closed with WhatsApp groups, memory, and goodwill — which breaks down when:

- Food sits too long and becomes unsafe
- Nobody knows who claimed what
- There is no proof that meals actually reached the animals
- Helpers burn out from chaotic coordination

FeedSheru exists to make that chain **visible, assignable, and trustworthy**.

---

## The idea

One rescue job moves through three roles (the same person can hold more than one):

| Role | Who | What they do |
| --- | --- | --- |
| **Provider** | Restaurants, shops, stalls, kitchens | List leftover / surplus food with pickup time and place |
| **Maker** | Volunteers or micro-kitchens | Collect surplus, prepare animal-safe meals, mark batches ready |
| **Distributor** | Feeders / animal-welfare volunteers | Pick up portions, feed street dogs, log proof |

Some jobs skip the Maker when food is already safe to feed. Some Makers also distribute. The product tracks the path either way.

```text
Provider lists surplus
        ↓
Maker claims & prepares (when needed)
        ↓
Distributor feeds street dogs + logs proof
        ↓
Job closes as FED
```

**“Reached animals” only counts when a feed is logged** (photo + place + rough amount) — not when food merely left a kitchen.

---

## Product aims

1. **Rescue food** that would otherwise be dumped  
2. **Coordinate** Providers, Makers, and Distributors in one neighbourhood  
3. **Keep a chain of custody** so donations don’t vanish mid-route  
4. **Stay simple** — a website on phones, shareable by link (no app store required for v1)  
5. **Stay open** — contributors can help build the loop from the [roadmap](./ROADMAP.md)

### What “Sheru” means here

Sheru is the friendly name for the street dog waiting at the end of the chain. The brand is a reminder: every listing should end with a fed animal, not an empty chat thread.

---

## How people will use it

FeedSheru is a **mobile-first website**, not a downloadable store app (for now).

1. Open the site on a phone browser  
2. Sign up / log in  
3. Choose how you help (Provider, Maker, Distributor)  
4. Complete your part of a job  
5. Optionally “Add to Home Screen” later for an app-like shortcut  

Perfect for sharing a link on WhatsApp with a restaurant owner or a feeder in the same area.

---

## What’s built today

| Area | Status |
| --- | --- |
| Marketing / mission framing | In progress via this README + UI copy |
| Email + password auth | Done (session cookies, Neon Postgres) |
| Password hashing | Done (bcrypt) |
| Post-login onboarding shell | Done (role selection is next) |
| Provider listings | Planned |
| Maker claim / cook flow | Planned |
| Distributor feed logs | Planned |
| Maps / photos / SLA flags | Planned |

See the full backlog in [ROADMAP.md](./ROADMAP.md).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | [Next.js](https://nextjs.org/) (App Router) + React + TypeScript |
| UI | Tailwind CSS (evergreen brand palette) |
| Database | [Neon](https://neon.com/) Postgres |
| ORM | [Drizzle](https://orm.drizzle.team/) |
| Auth | First-party email/password + HTTP-only session cookies |

Hosting target for a public pilot: **Vercel** (app) + **Neon** (database).

---

## Local setup

### Prerequisites

- Node.js 20+ (recommended)
- A free [Neon](https://neon.com/) project (or any Postgres URL)
- npm

### Install

```bash
git clone https://github.com/Sairaj-24/feedsheru.git
cd feedsheru
npm install
cp .env.example .env.local
```

### Environment

Edit `.env.local`:

```bash
# Generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=your-long-random-string

DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

### Run

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Drizzle schema to Postgres |
| `npm run db:studio` | Open Drizzle Studio |

---

## Project principles

- **Mobile first** — design for phones; desktop can wait  
- **Proof over promises** — a job isn’t success until feed is logged  
- **Flexible paths** — not every rescue needs all three roles  
- **Safe food** — leftovers for dogs still need rules (checklist in product)  
- **Small PRs** — one clear change at a time ([CONTRIBUTING.md](./CONTRIBUTING.md))

---

## Contributing

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)  
2. Pick something from [ROADMAP.md](./ROADMAP.md) or an open issue  
3. Open a pull request  

New here? Prefer items marked **good first issue**.

---

## Security

Do not commit secrets (`.env.local`, API keys, database URLs).  
To report a vulnerability, see [SECURITY.md](./SECURITY.md).

---

## License

[MIT](./LICENSE)

---

**FeedSheru** — leftover food, fed to Sheru.
