# WASDrop Product Specification

Last updated: 2026-03-01

## 1. Product Overview
WASDrop is a web platform that aggregates PC game deals and gamer-relevant industry news in one place, with region-aware pricing, account-based wishlist and alerts, and an admin console for curation and sync operations.

## 2. Product Goals
1. Help users discover the best game prices across multiple stores quickly.
2. Provide relevant gaming industry news without requiring users to track many sources.
3. Enable personalized tracking through wishlist, price alerts, and account preferences.
4. Give admins safe tooling to curate content and control ingestion jobs.

## 3. Target Users
1. PC gamers tracking discounts and freebies.
2. Price-sensitive users comparing stores by country.
3. Returning users who want alerts and saved preferences.
4. Admin operators managing curation and data quality.

## 4. Core Product Principles
1. Aggregator-first ingestion for MVP (no fragile scraping in core path).
2. Country is the primary locale selector; currency formatting derives from country.
3. Human-in-the-loop for admin content changes by default.
4. Clear degraded modes when optional providers are not configured.
5. Security-first open-source posture (no secrets committed, explicit env config).

## 5. Scope (Current Implemented State)

### 5.1 Public Pages
1. `/` Home with featured/trending/freebies/news blocks.
2. `/deals` with filtering, sorting, search, pagination.
3. `/game/[slug]` with pricing, images, requirements, history chart.
4. `/news` and `/news/[slug]`.
5. `/freebies`, `/about`, `/contact`.
6. Legal pages: `/privacy`, `/terms`, `/cookies`, `/dmca`, `/attribution`.

### 5.2 Auth and Account
1. Credentials auth (email/password with bcrypt hash).
2. Google OAuth.
3. Steam OpenID.
4. `/auth/sign-in`, `/auth/sign-up`, `/login` (compat route).
5. `/account` with region preference, connected providers, marketing opt-in, wishlist, price alerts, activity.
6. GDPR endpoints for export and delete account.

### 5.3 Admin
1. `/admin` for curated lists, jobs, and source management.
2. `/admin/ai` assistant for operational proposals.
3. Manual proposal apply endpoint with audit logs.
4. Optional auto-apply mode (`ADMIN_AI_AUTO_APPLY=true`) with audit logs.

### 5.4 AI Features
1. User AI chat (`/chat`) grounded by DB tool-calls (deals/news queries).
2. Admin AI chat with proposal generation:
- `create_curation`
- `categorize_news`
- `cleanup_expired_deals`
- `trigger_sync`
- `create_news_article`
- `create_game_deal`
3. Separate user/admin model credentials.

### 5.5 Ingestion and Jobs
1. Deals sync (aggregator adapter based, region-aware).
2. News sync (RSS whitelist ingestion + dedupe).
3. Cron endpoints for sync jobs guarded by `CRON_SECRET`.
4. Job runs persisted in DB.

## 6. Architecture and Data Strategy
1. Primary deals source: aggregator API adapter (`CheapSharkAdapter`).
2. Source adapter abstraction supports future direct store adapters.
3. Optional safe Steam metadata enrichment without scraping dependency.
4. Prisma + PostgreSQL as source of truth.
5. ISR and server-side caching applied on read paths where appropriate.

## 7. Functional Requirements

### 7.1 Deals
1. Display title, image, store, original price, current price, discount percent.
2. Region-aware query and formatting.
3. Wishlist add/remove for authenticated users.
4. Price alerts persisted in DB.
5. Price history snapshots persisted and charted.

### 7.2 News
1. Ingest from enabled RSS sources.
2. Deduplicate by article URL.
3. Category and source attribution required.
4. Optional AI summary only when enabled and configured.

### 7.3 Auth and Consent
1. Credentials signup validation:
- email valid
- password min 8
- at least one number
- at least one uppercase
2. Marketing opt-in default false.
3. Price alert delivery must respect `marketingOptIn=true`.

### 7.4 Admin Safety
1. RBAC required (`ADMIN` role).
2. Audit every applied admin AI action.
3. No secret values in logs or prompts.

## 8. Non-Functional Requirements
1. Security: no committed secrets, protected cron endpoints, auth rate limiting.
2. Reliability: job retries/backoff for ingestion operations.
3. Performance: paginated listings, optimized media, cache where possible.
4. Accessibility baseline on forms/navigation.
5. Traceability: `AuditLog` for admin actions, `JobRun` for sync status.

## 9. Data Model (High-Level)
1. User/Auth: `User`, `Account`, `Session`, `VerificationToken`.
2. Catalog: `Store`, `Game`, `GameImage`, `Deal`, `PriceSnapshot`.
3. Personalization: `WishlistItem`, `PriceAlert`, `UserActivity`.
4. News: `NewsSource`, `NewsArticle`.
5. Admin/ops: `AdminCuration`, `AuditLog`, `JobRun`.

## 10. Environment Configuration Contract

### 10.1 Required for Core Runtime
1. `DATABASE_URL`
2. `NEXTAUTH_SECRET`
3. `NEXTAUTH_URL`
4. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if Google sign-in should work)
5. `STEAM_REALM_URL`, `STEAM_RETURN_URL` (if Steam sign-in should work)
6. `DEALS_API_BASE_URL`

### 10.2 Optional Feature Flags and Providers
1. Alerts email: `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`
2. News summaries: `OPENAI_API_KEY`, `NEWS_SUMMARY_ENABLED=true`
3. User AI: `AI_CHAT_ENABLED=true`, `QWEN_USER_*`
4. Admin AI: `ADMIN_AI_ENABLED=true`, `QWEN_ADMIN_*`
5. Admin AI auto apply: `ADMIN_AI_AUTO_APPLY=true`
6. Cron auth: `CRON_SECRET`
7. Mock mode: `ENABLE_MOCK_DATA=true`

## 11. Competitive Expansion Plan (Inspired by gg.deals Features)
Design can stay custom; these are functional additions only.

### P0
1. Advanced alert rules (`target`, `discount`, `new historical low`, `free`).
2. Notification center and digest settings.
3. Saved filters and persistent user-level exclusions.
4. Official store vs keyshop source-type toggle.
5. Better trust/ranking score for deals.

### P1
1. Bulk wishlist and alert actions.
2. Import sync from Steam wishlist.
3. Smart collections (query-based dynamic lists).
4. Region-to-region price comparison.
5. Public share links for lists and filters.

### P2
1. Personalization/ranking by user behavior.
2. Recommendation feed and forecasted drops.
3. Community layer (follows, comments, moderation).
4. Partner widgets/public API.

## 12. Success Metrics
1. Weekly active users.
2. Wishlist to alert conversion rate.
3. Alert delivery success rate and alert click-through rate.
4. Deals page engagement (search/filter usage, outbound store clicks).
5. News read depth and return rate.
6. Admin job failure rate and stale data ratio.

## 13. Out of Scope (Current)
1. Checkout, cart, payment processing, order management.
2. Scraping-heavy direct store pipelines as MVP default.
3. Automatic irreversible admin AI mutations without logs.

## 14. Definition of Done for Product Changes
1. Feature behavior defined with acceptance criteria.
2. DB changes include migration and seed update if needed.
3. `.env.example` updated for any new config.
4. Unit tests for core logic and guardrails.
5. Readme/docs updated for setup and operations impact.
6. Lint, unit tests, and build pass.
