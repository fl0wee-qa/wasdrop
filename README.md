# WASDrop

WASDrop is a Next.js + Prisma + PostgreSQL gaming deals and gaming industry news aggregator with region-aware pricing, wishlist, alerts, and admin-controlled ingestion jobs.

## Architecture Choice (Mandatory)

### A) Aggregator API approach (selected for MVP)
- **Choice**: Use a deals aggregator API adapter as the primary source (`CheapSharkAdapter` by default).
- **Why**:
  - Lower ToS and legal risk than store scraping.
  - Single ingestion path for multi-store deal normalization.
  - Faster MVP with stable pricing/discount data.
- **Tradeoffs**:
  - Metadata quality varies by provider.
  - Region/currency depth is limited by the aggregator.
  - Dependency on third-party API uptime.

### B) Direct store integrations (Phase 2+)
- **Benefits**:
  - Richer store-specific fields, higher fidelity pricing per market.
  - Better control over refresh cadence and fallback logic.
- **Risks**:
  - Different auth/rate-limit schemes per store.
  - Higher maintenance and legal/ToS complexity.
  - Scraping is explicitly avoided in MVP.

### Source Adapter Layer (implemented)
Adapters implement:
- `getDeals(region)`
- `getGameDetails(id, region)`
- `getPriceHistory(id, region)`

Current adapters:
- `CheapSharkAdapter` (primary MVP aggregator)
- `MockDealsAdapter` (explicit degraded mode)
- optional Steam safe metadata enrichment via official appdetails endpoint (no scraping)

## Required/Optional Keys Checklist

### REQUIRED
1. `DATABASE_URL`
- **Env**: `DATABASE_URL`
- **Without it**: app cannot connect; all DB-backed pages and auth fail.

2. `NEXTAUTH_SECRET`
- **Env**: `NEXTAUTH_SECRET`
- **Without it**: NextAuth init fails.

3. Google OAuth credentials
- **Env**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Without it**: Google login button is shown as unavailable.

4. Steam OpenID callback/realm setup
- **Env**: `STEAM_REALM_URL`, `STEAM_RETURN_URL` (and optional `STEAM_API_KEY` for future steam web usage)
- **Without it**: Steam OpenID callback cannot complete reliably in non-local deployments.

5. Deals aggregator API config (MVP primary)
- **Env**: `DEALS_API_BASE_URL`, optional header `DEALS_API_KEY`
- **Without it**: ingestion uses mock mode only when `ENABLE_MOCK_DATA=true`; otherwise sync fails loudly.

6. News ingestion method
- **Env**: RSS sources are DB-managed (`NewsSource` table), optionally seeded.
- **Without it**: `/news` remains empty until admin adds sources or seed runs.

### OPTIONAL
1. Email provider for alert delivery
- **Env**: `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`
- **Without it**: alerts are stored; delivery is stubbed and logged.

2. LLM key for AI summaries
- **Env**: `OPENAI_API_KEY`, `NEWS_SUMMARY_ENABLED=true`
- **Without it**: `aiSummary` remains empty.

3. User AI chat (Qwen OpenAI-compatible)
- **Env**: `AI_CHAT_ENABLED=true`, `QWEN_USER_API_KEY`, `QWEN_USER_BASE_URL`, `QWEN_USER_MODEL`
- **Without it**: `/chat` shows disabled notice, `/api/chat/user` returns 503.

4. Admin AI assistant (separate key)
- **Env**: `ADMIN_AI_ENABLED=true`, `QWEN_ADMIN_API_KEY`, `QWEN_ADMIN_BASE_URL`, `QWEN_ADMIN_MODEL`
- **Without it**: `/admin/ai` shows disabled notice and admin AI endpoints return 503.

5. Cron auth secret
- **Env**: `CRON_SECRET`
- **Without it**: `/api/cron/*` rejects requests with a clear configuration message.

## MVP -> V1 -> V2 Roadmap

### MVP (implemented now)
- Pages: `/`, `/deals`, `/game/[slug]`, `/news`, `/news/[slug]`, `/freebies`, `/about`, `/contact`, `/auth/sign-in`, `/auth/sign-up`, `/login` (compat redirect), `/account`, `/chat`, `/admin`, `/admin/ai`, legal pages.
- Deals ingestion via aggregator adapter with multi-store normalization.
- Region selector + persistence (cookie + DB for logged-in users) + IP suggestion endpoint.
- Deal filters/search/sort/pagination.
- Game detail with images, pricing, system requirements, snapshots chart.
- Wishlist + price alerts persisted in DB.
- Credentials auth (email/password + bcrypt hash), Google OAuth, Steam OpenID, and auth endpoint rate limiting.
- Account settings with connected providers, persisted region preference, and `marketingOptIn`.
- Consent-based emails: sends only when `marketingOptIn=true`.
- RSS news ingestion with dedupe.
- NextAuth with Google + Steam OpenID bridge.
- Admin curation/news source management + manual job triggers.
- User AI chat grounded on DB deals/news via tool calling.
- Admin AI assistant with human-in-the-loop proposals + explicit apply + `AuditLog`.
- Job tracking and cron endpoints.
- GDPR account export + delete.

### V1
- Stronger user-facing filtering UX (multi-select stores, persisted filter presets).
- Better region/currency support by upgrading aggregator provider.
- Real alert notifications (Resend/SendGrid/Telegram) + alert hit detection job.
- Admin moderation queue + richer curation editor.

### V2
- Direct store adapters (Steam/Epic/Microsoft where officially feasible).
- Personalized recommendations and similarity model.
- Price anomaly detection and seasonal trend analytics.
- Multi-language content and region-specific SEO.

## Tech stack
- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- NextAuth + Prisma Adapter
- Tailwind CSS + shadcn-style components
- Zod validation
- In-app job runner + cron endpoints
- Vitest (unit) + Playwright (e2e)
- ESLint + Prettier

## Setup (Windows)

1. Copy env template:
```powershell
Copy-Item .env.example .env
```

2. Start Postgres (Docker optional):
```powershell
docker compose up -d postgres
```

3. Install and migrate:
```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Run app:
```powershell
npm run dev
```

Open `http://127.0.0.1:3000`.

## Auth Routes
- Sign in: `/auth/sign-in`
- Sign up: `/auth/sign-up`
- Legacy `/login` redirects to `/auth/sign-in`

## Qwen (OpenAI-Compatible) Configuration
1. Set user AI env vars:
```env
AI_CHAT_ENABLED="true"
QWEN_USER_API_KEY="..."
QWEN_USER_BASE_URL="https://your-openai-compatible-endpoint/v1"
QWEN_USER_MODEL="qwen/qwen3.5-397b-a17b-a17b"
```
2. Set admin AI env vars (separate credentials):
```env
ADMIN_AI_ENABLED="true"
QWEN_ADMIN_API_KEY="..."
QWEN_ADMIN_BASE_URL="https://your-openai-compatible-endpoint/v1"
QWEN_ADMIN_MODEL="qwen/qwen3.5-397b-a17b-a17b"
```
3. Restart app.  
- `/chat` uses user key only.
- `/admin/ai` uses admin key only.
- Admin AI never writes directly; it proposes JSON and requires explicit Apply click.

## Production `.env` Checklist
Use your real domain values (example uses `https://wasdrop.com`):

```env
# Core
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
NEXTAUTH_SECRET="long-random-hex-secret"
NEXTAUTH_URL="https://wasdrop.com"

# OAuth (Google)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
# Google redirect URI:
# https://wasdrop.com/api/auth/callback/google

# OAuth (Steam OpenID)
STEAM_REALM_URL="https://wasdrop.com"
STEAM_RETURN_URL="https://wasdrop.com/api/auth/steam/callback"

# Deals source
DEALS_API_BASE_URL="https://www.cheapshark.com/api/1.0"
DEALS_API_KEY=""
DEALS_SYNC_COUNTRIES="US,GB,DE"

# RSS / summaries
NEWS_SYNC_LIMIT="100"
NEWS_SUMMARY_ENABLED="false"
OPENAI_API_KEY=""

# Alerts (optional but recommended)
RESEND_API_KEY=""
ALERTS_FROM_EMAIL="alerts@wasdrop.com"

# User AI (optional)
AI_CHAT_ENABLED="false"
QWEN_USER_API_KEY=""
QWEN_USER_BASE_URL="https://<provider>/v1"
QWEN_USER_MODEL="qwen/qwen3.5-397b-a17b-a17b"

# Admin AI (optional, separate credentials)
ADMIN_AI_ENABLED="false"
QWEN_ADMIN_API_KEY=""
QWEN_ADMIN_BASE_URL="https://<provider>/v1"
QWEN_ADMIN_MODEL="qwen/qwen3.5-397b-a17b-a17b"

# Cron protection
CRON_SECRET="another-long-random-secret"

# Admin bootstrap
ADMIN_EMAIL="owner@wasdrop.com"
ENABLE_IN_APP_JOBS="false"
ENABLE_MOCK_DATA="false"
```

Production sanity checks:
- Do not keep `NEXTAUTH_URL` on localhost.
- Google OAuth redirect/authorized origins must match your domain exactly.
- Steam `REALM` and `RETURN_URL` must use the same production domain and protocol (`https`).
- Set `CRON_SECRET` and send `Authorization: Bearer <CRON_SECRET>` from scheduler.
- Keep `ENABLE_MOCK_DATA=false` in production.

## Useful scripts
- `scripts/dev.ps1 -WithDocker`
- `scripts/db.ps1 -Action migrate|push|seed|studio`
- `scripts/test.ps1`
- `npm run jobs:sync-deals`
- `npm run jobs:sync-news`

## Cron
- `POST /api/cron/sync-deals`
- `POST /api/cron/sync-news`
- Header: `Authorization: Bearer <CRON_SECRET>`
- If `CRON_SECRET` is unset, cron endpoints reject with a clear config error.

## Open-source safety
- Never commit `.env`.
- Logs/audit avoid secrets.
- Local listeners use `127.0.0.1` in scripts.
- See [`SECURITY.md`](./SECURITY.md).

## API docs
See [`docs/api.md`](./docs/api.md).

