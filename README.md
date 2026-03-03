# NEWSTACK

AI-first public news intelligence platform by ORIGINX LABS.

NEWSTACK combines trusted source aggregation, structured intelligence, civic workflows, and modern newsroom tooling into one production-ready platform.

## Highlights

- Real-time India + global news ingestion and distribution
- AI summaries, translation, and confidence-first storytelling workflows
- Public Grievances module with structured ticketing and tracking
- Open Politics intelligence layer for parties, leaders, and public narratives
- API products for developers and enterprise teams
- Progressive Web App experience with responsive UI and accessibility support

## Platform Capabilities

### Reader Experience
- News, India, World, and Places views
- Source-rich story context and verification signals
- Audio experience (TTS) with usage controls
- Trending Pulse and live feed-driven UX patterns

### Enterprise & Developer Experience
- API access, pricing and subscription journey
- Usage validation and metering utilities
- Modular OpenNews schema and route architecture
- Supabase-backed auth, data, realtime and edge functions

### Public Value Modules
- Public Grievances intake and lifecycle flow
- Civic data integration for India-focused transparency use cases

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- State/Data: React Query, Supabase JS client
- Backend: Supabase Postgres + Edge Functions (Deno)
- Payments: Razorpay checkout + server-side signature verification
- Email: Resend-powered transactional email flows
- Tooling: ESLint, TypeScript, PostCSS, Vercel-ready deployment config

## Monorepo Structure (Key Paths)

- `src/` — application pages, components, hooks, modules
- `modules/opennews/` — OpenNews domain module
- `supabase/functions/` — edge functions (payments, API, ingestion, auth flows)
- `supabase/migrations/` — database migrations and schema updates
- `data/rss-feeds/` — curated feed input and health datasets
- `scripts/` — migration and ops scripts
- `docs/` — product and module documentation

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase project (for backend integrations)

### Install
```bash
npm install
```

### Run (Development)
```bash
npm run dev
```

### Build (Production)
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## Environment & Secrets

Configure project and function secrets before production usage:

- Supabase URL and anon/service role keys
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `RESEND_API_KEY`

For full migration and infrastructure instructions, see `MIGRATION_GUIDE.md`.

## Payments & Donations

NEWSTACK supports donor-backed sustainability through Razorpay.

- Support flow includes popup checkout
- Minimum contribution support enabled from ₹50
- Named or anonymous donation support
- Thank-you email flow for donor communication

## Support NEWSTACK / Donate NEWSTACK

If NEWSTACK helps your newsroom, research team, or civic work, consider supporting the platform.

- In app: use **Support OpenNews / Support NEWSTACK**
- Email: support@newstack.live
- Enterprise collaboration: sales@newstack.live

Your contribution helps sustain independent, transparent, and public-interest technology.

## Quality & Validation

- Production build is validated via `npm run build`
- Core UI and backend flows are modular and migration-friendly
- Supabase migrations maintain auditable schema evolution

## License & Ownership

Product and codebase managed by ORIGINX LABS.

---

© 2026 NEWSTACK by ORIGINX LABS. All rights reserved.
