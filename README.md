# FeedSheru

Sheru is a street dog that needs your help.

FeedSheru turns leftover food into meals that reach street dogs — through people who **provide**, **cook/make**, and **distribute**.

This project is open source. New contributors are welcome to implement features from the [roadmap](./ROADMAP.md).

## What exists today

- Email/password signup and login
- Session cookies with Neon Postgres
- Post-login onboarding placeholder (role selection comes next)

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- React + TypeScript
- Tailwind CSS
- [Neon](https://neon.com/) Postgres + Drizzle ORM

## Prerequisites

- Node.js 20+ (recommended)
- A free [Neon](https://neon.com/) project (or any Postgres URL)
- npm

## Local setup

```bash
git clone https://github.com/Sairaj-24/feedsheru.git
cd feedsheru
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=your-long-random-string

DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

Push the schema, then start the app:

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Drizzle schema to Postgres |
| `npm run db:studio` | Open Drizzle Studio |

## How to contribute

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Pick an item from [ROADMAP.md](./ROADMAP.md) (or an open GitHub issue)
3. Open a PR

Looking for a first task? Prefer items marked **good first issue** in the roadmap.

## Security

Do not commit secrets (`.env.local`, API keys, database URLs). See [SECURITY.md](./SECURITY.md) to report vulnerabilities.

## License

[MIT](./LICENSE)
