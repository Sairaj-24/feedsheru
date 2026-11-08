# Roadmap & starter issues

Use this list as the contributor backlog. After the repo is public, copy these into GitHub Issues and apply the suggested labels.

Status key: **todo** · **good first issue** · **larger**

---

## Now (foundation)

### 1. Role selection during onboarding
- **Status:** done
- **Why:** Post-login page already says users will choose Provider, Maker, or Distributor.
- **Suggested work:**
  - Add a `role` field on `users` (or a profile table)
  - UI: three clear choices on `/onboarding`
  - Persist selection and gate later screens by role
- **Acceptance:** New user can pick a role once; returning users land on a role-aware home.

### 2. Basic profile fields
- **Status:** done (name + city/area on onboarding; phone column unused)
- **Why:** Roles need a display name and rough area to coordinate food.
- **Suggested work:**
  - Name, city/area, optional phone
  - Simple edit form after role selection
- **Acceptance:** Profile saves and shows on the user’s home screen.

### 3. Protected route helper
- **Status:** done
- **Why:** Keep auth checks consistent as features grow.
- **Suggested work:**
  - Shared helper/layout that redirects unauthenticated users
  - Optional role check helper
- **Acceptance:** Unauthenticated visits to app pages redirect to `/`.

---

## Next (core loop)

### 4. Provider: create a surplus food listing
- **Status:** done
- **Why:** Providers are the supply side of the loop.
- **Suggested work:**
  - Listing model: title, description, quantity, pickup window, area
  - Create + list “my listings” for Provider role
- **Acceptance:** Provider can publish a listing and see it in their list.

### 5. Maker: claim a listing to cook
- **Status:** done
- **Why:** Surplus becomes meals through makers.
- **Suggested work:**
  - Browse open listings
  - Claim flow with status (`open` → `claimed` → `ready`)
- **Acceptance:** Only one maker can claim an open listing; status updates for both sides.

### 6. Distributor: claim ready meals for delivery
- **Status:** done
- **Why:** Meals need to reach street dogs.
- **Suggested work:**
  - Browse `ready` meals
  - Claim + mark `delivered`
- **Acceptance:** Distributor can complete a delivery and the listing closes.

### 7. Listing status timeline
- **Status:** done
- **Why:** Everyone needs a shared source of truth.
- **Suggested work:**
  - Show status history on a listing detail page
- **Acceptance:** Detail page shows current status and recent transitions.

---

## Later (trust & reach)

### 8. City / area filter on listings
- **Status:** done (maker browse filters by onboarding area, case-insensitive)
- **Suggested work:** Filter browse views by city/area string (map optional later).

### 9. Simple activity feed on home
- **Status:** done
- **Suggested work:** Show the signed-in user’s recent listings/claims.

### 10. Empty states & copy pass
- **Status:** done (role homes + listing not-found)
- **Suggested work:** Friendly empty states for each role when there is nothing to do yet.

### 11. Seed script for demo data
- **Status:** done (`npm run db:seed`)
- **Suggested work:** Script that creates sample users + listings for local demos (no real PII).

### 12. Deploy a public demo
- **Status:** todo · chore · maintainer
- **Suggested work:** Host on Vercel + Neon; link from README. Self-host path is documented in `docs/HOSTING.md` (Docker Compose).

---

## Out of scope (for now)

- Payments / donations processing
- Real-time chat
- Full maps / GPS routing
- Native mobile apps

Propose these as separate RFCs if you want to explore them.
