# NEWSTACK Architecture

## Platform at a Glance

![NEWSTACK Preview](../public/og-image.png)

NEWSTACK is designed as a modular, production-grade civic news intelligence system with frontend UX, API distribution, ingestion automation, moderation controls, and donation-backed sustainability.

---

## System Architecture

```mermaid
flowchart LR
    U[Readers / Journalists / Admins / Developers] --> FE[Web App\nReact + Vite + TypeScript]
    FE --> GW[Vercel Edge + Rewrites]
    GW --> API[Supabase Edge Functions]
    API --> DB[(Supabase Postgres)]
    API --> AUTH[Supabase Auth + RLS]
    API --> RT[Realtime Channels]
    API --> PAY[Razorpay]
    API --> MAIL[Resend]
```

### Core Characteristics
- Frontend-first experience with route-based modules and PWA support
- Backend contracts served via Supabase edge functions
- Security model based on role checks and database policies
- Clear separation between ingestion flows, user flows, and governance flows

---

## Data & Processing Architecture

```mermaid
flowchart TD
    F[RSS / Source Feeds] --> ING[Ingest Functions + Schedulers]
    ING --> NORM[Normalize + Dedupe + Enrich]
    NORM --> S[(stories, story_sources, metrics)]
    S --> C[Confidence / Intelligence Layers]
    C --> UI[News, India, World, Places, Trending]
```

### Notes
- Feed health and publisher/state datasets are maintained under `data/rss-feeds/`
- Migration safety and schema evolution are managed under `supabase/migrations/`
- Operational scripts for sync/audit live under `scripts/`

---

## OpenNews Moderation Architecture

```mermaid
flowchart TD
    P[Post / Reply Create] --> H[Heuristic Scoring + Banned Term Checks]
    H --> D{Decision}
    D -->|Clean| PUB[Publish]
    D -->|Watch| WATCH[Visible with watch status]
    D -->|Queued| Q[Moderation Queue]
    D -->|Hidden Auto| HIDE[Auto Hidden]
    Q --> MOD[Moderator Decision]
    MOD --> AP[Approve Override]
    MOD --> RJ[Reject / Keep Hidden]
```

### Safety Layers
- Anonymous identity rate limiting
- Policy-driven ban and regex filters
- Queue + event logs for moderation accountability

---

## Payments & Donor Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI as Support Modal (Frontend)
    participant CF as create-razorpay-order
    participant RP as Razorpay
    participant VF as verify-razorpay-payment
    participant Mail as Resend

    User->>UI: Enter amount (>=₹50), name/email, anonymous option
    UI->>CF: Create order request
    CF->>RP: Create Razorpay order
    RP-->>UI: Checkout popup + payment
    UI->>VF: Send payment signature data
    VF->>VF: Verify signature + update donation record
    VF->>Mail: Trigger thank-you email
    VF-->>UI: Success response
```

---

## Repository Architecture Map

- `src/` → app pages, shared components, modules, UI flows
- `modules/opennews/` → OpenNews domain package structure
- `supabase/functions/` → ingestion, API, auth, payment, email logic
- `supabase/migrations/` → schema, RLS, feature rollout SQL
- `docs/` → architecture and product documentation
- `data/rss-feeds/` → feed datasets, audits, coverage snapshots

---

## Deployment Architecture (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback should route app paths to `/index.html` while preserving static assets
- API rewrites proxy app endpoints to Supabase edge functions

---

## Related Docs

- [Main README](../README.md)
- [Migration Guide](../MIGRATION_GUIDE.md)
- [OpenNews Social Notes](./opennews-social.md)
- [OpenNews Module README](../modules/opennews/README.md)
