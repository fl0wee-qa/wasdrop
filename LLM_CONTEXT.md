# WASDrop LLM Context

Last updated: 2026-03-01

This file is the compact handoff context for any LLM/agent working on this repository.

## 1. Project Identity
- Name: WASDrop
- Type: Gaming deals + gaming news aggregator
- Stack: Next.js App Router + TypeScript + Prisma + PostgreSQL + NextAuth

## 2. Runtime and Deployment Model
- App server: Next.js
- DB: PostgreSQL (Prisma)
- Auth: Credentials + Google + Steam OpenID
- Jobs: in-app job runner + cron HTTP endpoints
- Hosting pattern: Vercel (app) + managed Postgres (e.g., Railway)

## 3. Current Feature Set (Implemented)
1. Deals, game details, freebies, news pages.
2. Region selector and persistence.
3. Wishlist and price alerts persistence.
4. Admin console and job triggers.
5. User AI chat (DB-grounded tool calling).
6. Admin AI assistant with proposal flow and optional auto-apply.
7. Legal pages and cookie consent.

## 4. Key Routes
- Public pages: `/`, `/deals`, `/game/[slug]`, `/news`, `/news/[slug]`, `/freebies`
- Auth: `/auth/sign-in`, `/auth/sign-up`, `/login`
- Account: `/account`
- Admin: `/admin`, `/admin/ai`
- API root areas:
  - `/api/auth/*`
  - `/api/account/*`
  - `/api/wishlist`
  - `/api/alerts`
  - `/api/chat/user`
  - `/api/admin/*`
  - `/api/cron/sync-deals`, `/api/cron/sync-news`

## 5. Important Data Entities
- Users/auth: `User`, `Account`, `Session`
- Catalog: `Game`, `GameImage`, `Store`, `Deal`, `PriceSnapshot`
- User features: `WishlistItem`, `PriceAlert`, `UserActivity`
- News: `NewsSource`, `NewsArticle`
- Admin/ops: `AdminCuration`, `AuditLog`, `JobRun`

## 6. Environment Contract

### Required for baseline app
1. `DATABASE_URL`
2. `NEXTAUTH_SECRET`
3. `NEXTAUTH_URL`
4. `DEALS_API_BASE_URL`

### Needed for specific features
1. Google auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
2. Steam auth: `STEAM_REALM_URL`, `STEAM_RETURN_URL`
3. User AI: `AI_CHAT_ENABLED=true`, `QWEN_USER_API_KEY`, `QWEN_USER_BASE_URL`, `QWEN_USER_MODEL`
4. Admin AI: `ADMIN_AI_ENABLED=true`, `QWEN_ADMIN_API_KEY`, `QWEN_ADMIN_BASE_URL`, `QWEN_ADMIN_MODEL`
5. Admin AI auto-apply: `ADMIN_AI_AUTO_APPLY=true`
6. Cron auth: `CRON_SECRET`
7. Email alerts: `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`
8. News summaries: `OPENAI_API_KEY`, `NEWS_SUMMARY_ENABLED=true`

## 7. Invariants and Guardrails
1. Never commit secrets.
2. Keep `CRON_SECRET` check enforced on cron endpoints.
3. Respect consent: do not send marketing/alert emails when `marketingOptIn=false`.
4. Preserve role checks (`ADMIN`) on admin routes.
5. Do not remove audit logging for admin AI applied actions.
6. Keep source adapter architecture; avoid scraping-first regressions.
7. Keep region-as-country behavior consistent across queries and formatting.

## 8. Existing AI Behavior
- User chat: grounded via internal DB tools, no external browsing.
- Admin chat: proposes actions; default manual apply.
- Auto apply exists behind `ADMIN_AI_AUTO_APPLY` and still writes audit logs.

## 9. Common Commands
- Dev: `npm run dev`
- Lint: `npm run lint`
- Unit tests: `npm run test:unit`
- E2E: `npm run test:e2e`
- Build: `npm run build`
- Prisma generate: `npm run db:generate`
- Migrate dev: `npm run db:migrate`
- Seed: `npm run db:seed`
- Job manual: `npm run jobs:sync-deals` / `npm run jobs:sync-news`

## 10. Expected Change Workflow
1. Read existing behavior before modifying.
2. Apply incremental changes (no full rewrites unless requested).
3. Add migrations for schema changes.
4. Update `.env.example` for new config.
5. Update docs when behavior changes.
6. Run lint + tests + build before finalizing.

## 11. Known Local Noise
Untracked local files may exist during development (for example logo backups). Do not add them unless explicitly requested.

## 12. Recommended Next Product Work
1. Advanced alert rules and notification center.
2. Saved filter presets and source-type filters (official/keyshop).
3. Smart collections and bulk actions.
4. Region comparison and stronger deal scoring.
