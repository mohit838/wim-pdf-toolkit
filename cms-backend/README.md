# CMS Backend

`cms-backend/` is the runtime CMS API for the public site and the admin control panel.

## What It Does

- serves published runtime config for the public frontend
- accepts admin draft edits and publish actions
- stores release history and audit logs
- exposes a basic admin auth/session flow
- triggers frontend revalidation after publish
- persists draft and published CMS data in PostgreSQL through Prisma
- uses Redis for sessions, cache invalidation, publish queueing, and shared rate limiting

## Scope Clarification

- `cms-backend/` manages runtime site content/config (SEO, ads, legal/content library, publish/releases).
- PDF processing endpoints (`/api/pdf/*`) are provided by the separate Python `backend/` service.
- When new PDF tools are added, CMS can control their copy/SEO only after the frontend tool registry includes those tool IDs.

## Commands

```bash
pnpm install
pnpm dev
pnpm dev:worker
pnpm build
pnpm start
pnpm start:worker
```

## Environment

This app reads the shared root `.env` and uses the active `DEV_DOCKER_*` or `PROD_DOCKER_*` values for:

- `DOCKER_POSTGRES_URL`
- `DOCKER_REDIS_URL`
- `REDIS_CMS_PREFIX`
- `CMS_SESSION_SECRET`
- `CMS_REVALIDATE_SECRET`
- `CMS_SUPERADMIN_*`
- SMTP settings for future notifications

## Production Safety Guardrails

In `APP_DEV=false` mode, startup now enforces strong non-placeholder values for:

- `PROD_CMS_SESSION_SECRET`
- `PROD_CMS_REVALIDATE_SECRET`
- `PROD_CMS_INGEST_SECRET`
- `PROD_CMS_SUPERADMIN_PASSWORD`

Local dev keeps flexible defaults, but production boot fails fast if these are weak or placeholder values.
