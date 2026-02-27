# WASDrop API Notes

## Public

### `GET /api/region/suggest`
Returns `{ country }` based on IP geolocation suggestion.

## Auth

### `GET /api/auth/steam`
Starts Steam OpenID login flow.

### `GET /api/auth/steam/callback`
Steam OpenID callback. Redirects to `/auth/sign-in?steamToken=...`.

### `POST /api/auth/sign-up`
Body: `{ email, password, confirmPassword, marketingOptIn }`.
Creates credentials account (bcrypt hash). Includes basic IP rate limiting.

## User

### `POST /api/user/region`
Body: `{ country: "US" }`.
Persists country in cookie and user profile (if logged in).

### `GET|POST|DELETE /api/wishlist`
- `GET`: returns current user wishlist.
- `POST`: body `{ gameId }` add wishlist item.
- `DELETE`: body `{ gameId }` remove item.

### `GET|POST|DELETE /api/alerts`
- `GET`: returns current user alerts.
- `POST`: body `{ gameId, targetPriceCents, country, currency }`.
- `DELETE`: body `{ id }`.

### `GET /api/account/export`
Returns GDPR export payload for authenticated user.

### `DELETE /api/account/delete`
Deletes authenticated user and related records.

### `GET|PATCH /api/account/settings`
- `GET`: returns email, providers, `preferredCountry`, `marketingOptIn`.
- `PATCH`: body `{ preferredCountry?, marketingOptIn? }`.

## AI

### `POST /api/chat/user`
User-facing AI chat endpoint (Qwen OpenAI-compatible).
- Grounded tool calls over deals/news DB.
- Rate limited.
- Returns 503 when `AI_CHAT_ENABLED` is false or Qwen user config is missing.

### `POST /api/admin/ai/chat`
Admin-only AI assistant chat.
- Proposes JSON actions only.
- Rate limited.

### `POST /api/admin/ai/apply`
Admin-only explicit apply endpoint for AI proposals.
- Creates curations / categorizes news / cleanup / triggers sync.
- Logs applied actions to `AuditLog`.

## Admin (requires `ADMIN` role)

### `POST /api/admin/jobs/deals`
Optional body `{ countries: ["US", "GB"] }`.

### `POST /api/admin/jobs/news`
Triggers RSS sync.

### `GET|POST|DELETE /api/admin/curations`
Manage featured lists and collections.

### `GET|POST|DELETE /api/admin/news-sources`
Manage RSS source whitelist.

## Cron

### `POST /api/cron/sync-deals`
### `POST /api/cron/sync-news`
Both require `Authorization: Bearer <CRON_SECRET>`.

