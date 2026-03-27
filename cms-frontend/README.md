# CMS Frontend

`cms-frontend/` is the admin UI for managing runtime SEO, ads, analytics/verification integrations, and publish history.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

## Behavior

- runs on `http://localhost:3100` in local development
- proxies admin requests through `/api/cms/*`
- edits draft runtime config from `cms-backend/`
- publishes releases without rebuilding the public frontend

## Scope Clarification

- This app controls runtime content/config, not low-level PDF processing code.
- New backend PDF tools become CMS-manageable after frontend adds corresponding tool IDs/routes and SEO keys.
- Admin workflows for tool naming/description live in CMS once those tool records are exposed by frontend config.
