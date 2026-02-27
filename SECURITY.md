# SECURITY.md

## Security defaults
- Secrets are loaded from environment variables only.
- `.env` files are gitignored. Commit `.env.example` only.
- Default scripts bind app listeners to `127.0.0.1`.
- Admin actions are audited in `AuditLog` and do not store secrets.

## Required secrets
- `NEXTAUTH_SECRET`
- OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- `DATABASE_URL`
- `CRON_SECRET` for cron endpoints

## Recommended hardening
- Use HTTPS in production for OAuth callbacks.
- Rotate OAuth and cron secrets periodically.
- Restrict database user permissions.
- Add email provider SPF/DKIM when enabling alert delivery.
- Keep dependencies updated and run `npm audit` in CI.

## Reporting vulnerabilities
Please report vulnerabilities privately to the maintainers via the contact route or repository security contact.
