# Contributing to FeedSheru

Thanks for helping Sheru get fed. This guide keeps contributions small, reviewable, and safe.

## Before you start

1. Search [existing issues](https://github.com/Sairaj-24/feedsheru/issues) and [ROADMAP.md](./ROADMAP.md) so work isn’t duplicated.
2. Prefer opening (or claiming) an issue before a large change.
3. For brand-new ideas, open a feature request first so we can align on scope.

## Development setup

Follow the local setup in [README.md](./README.md). You need:

- Node.js 20+
- `.env.local` with `AUTH_SECRET` and a Postgres URL (Neon or any Postgres)
- `npm run db:migrate` (or `npm run db:push`) before first run

Self-hosting / deploy notes: [docs/HOSTING.md](./docs/HOSTING.md).

Never commit `.env.local` or real credentials.

## Branch & PR workflow

1. Fork the repo (or create a branch if you have write access).
2. Create a branch from `main`:

   ```bash
   git checkout -b feat/short-description
   ```

3. Make a focused change. One feature or fix per PR is ideal.
4. Run checks locally:

   ```bash
   npm run lint
   npm run build
   ```

5. Push and open a pull request using the PR template.
6. Link the related issue (`Closes #123`) when applicable.

### Branch naming

- `feat/...` — new feature
- `fix/...` — bug fix
- `docs/...` — documentation only
- `chore/...` — tooling, deps, cleanup

## What makes a good contribution

- Matches an agreed roadmap/issue item
- Keeps UI simple and mobile-first (the app targets phone-sized flows)
- Reuses existing auth/session/db patterns under `src/lib` and `src/db`
- Avoids committing secrets, local DB files, or generated build output
- Includes a short PR description: what changed, how to test

## Code guidelines

- TypeScript + App Router conventions already used in the repo
- Prefer small, readable components over large monoliths
- Put server-side auth/data logic in `src/lib` / route handlers, not in client components unless needed
- Schema changes go through Drizzle (`src/db/schema.ts`) and `npm run db:push` for local testing
- Don’t rewrite unrelated files “while you’re here”

## Issue labels (once issues are published)

| Label | Meaning |
| --- | --- |
| `good first issue` | Small, well-scoped starter task |
| `help wanted` | Ready for community ownership |
| `enhancement` | New product capability |
| `bug` | Something broken |
| `docs` | Documentation only |

## Code of conduct

Be respectful. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Questions

Open a GitHub Discussion/issue, or comment on the relevant roadmap item. Ambiguous requirements should be clarified before coding.
