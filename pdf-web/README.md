# Frontend

This frontend now runs on Next.js with the App Router and TypeScript.

Use placeholders only for any environment values in docs and examples.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm perf:lhci
```

Lighthouse CI helpers:

- `pnpm perf:lhci` builds and runs full Lighthouse CI (collect + assert + upload)
- `pnpm perf:lhci:collect` collects reports only
- `pnpm perf:lhci:assert` runs assertions against collected reports

## Environment

Use one root-level `.env` file only.

- `NEXT_PUBLIC_APP_DEV` selects which frontend env group is active.
- `NEXT_PUBLIC_DEV_SITE_ORIGIN` / `NEXT_PUBLIC_PROD_SITE_ORIGIN` are used for canonical and metadata URLs.
- `DEV_INTERNAL_API_ORIGIN` / `PROD_INTERNAL_API_ORIGIN` are the server-side backend targets used by Next rewrites.
- `DEV_INTERNAL_API_TOKEN` / `PROD_INTERNAL_API_TOKEN` are server-only shared tokens used by the frontend proxy when it talks to the backend.
- `DEV_CMS_API_INTERNAL_ORIGIN` / `PROD_CMS_API_INTERNAL_ORIGIN` are the server-side CMS API targets used for runtime SEO, analytics, and ad config reads.
- `DEV_CMS_REVALIDATE_SECRET` / `PROD_CMS_REVALIDATE_SECRET` protect the frontend revalidation endpoint that CMS publish calls.

Keep `NEXT_PUBLIC_APP_DEV` in sync with `APP_DEV` from the root `.env` so the browser and server pick the same group.
The root `docker-compose.yml` pins the frontend to the dev group, while `docker-compose.prod.yml` and Jenkins pin it to the prod group.

## Architecture

- App routes live in `src/app`
- Reusable UI lives in `src/components`
- Tool screens live in `src/views`
- API calls go through TanStack Query custom hooks
- The frontend serves `/api/*` through an internal server-side proxy that forwards requests to the active `DEV_INTERNAL_API_ORIGIN` or `PROD_INTERNAL_API_ORIGIN`.
- SEO defaults, page metadata, analytics IDs, verification tags, and ad placements are now loaded from `cms-api/` at runtime with local JSON fallback.
- CMS publish calls `/api/revalidate/cms`, so Google/Bing/AdSense changes go live without rebuilding the frontend.
- The app includes `error.tsx`, `global-error.tsx`, and a custom `not-found.tsx` so broken routes and runtime failures degrade gracefully.

## Tool Coverage Notes

- The backend API now includes additional endpoints (`/to-text`, `/remove-metadata`, `/add-page-numbers`, `/repair`) alongside existing PDF tools.
- If a tool is available in backend but not yet visible in the frontend menu, add it through `src/app/site.json` + route/view wiring.
- CMS draft/publish can control tool copy and SEO once the corresponding tool IDs and page keys are present in frontend config.
