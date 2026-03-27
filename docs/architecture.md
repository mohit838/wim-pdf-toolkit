# Architecture

## Overview

The repo now uses a four-app layout with one shared root env contract and one shared Docker/deploy layer.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                Public Internet                             │
│                                                                            │
│  app.example.com                cms.example.com            cms-api.example.com │
│          │                               │                     │            │
└──────────┼───────────────────────────────┼─────────────────────┼────────────┘
           │                               │                     │
           ▼                               ▼                     ▼
┌────────────────────┐      ┌────────────────────┐    ┌────────────────────┐
│     frontend/      │      │   cms-frontend/    │    │   cms-backend/     │
│  Next.js public    │      │ Next.js admin UI   │    │ Express runtime CMS│
│  PDF tools site    │      │                    │    │ + publish API      │
└─────────┬──────────┘      └─────────┬──────────┘    └─────────┬──────────┘
          │                           │                         │
          │ /api/* proxy              │ /api/cms/* proxy        │ published config
          ▼                           ▼                         │ admin auth/publish
┌────────────────────┐                                     ┌────▼─────────────┐
│     backend/       │                                     │ PostgreSQL + Redis│
│ FastAPI PDF API    │                                     │ CMS persistence,  │
│ private only       │                                     │ sessions, queues  │
└────────────────────┘                                     └──────────────────┘
```

## Repo Layout

```
backend/        private Python PDF API
frontend/       public tools frontend
cms-backend/    runtime CMS API + worker entrypoint
cms-frontend/   CMS admin panel
infra/          repo-level scripts and docker notes
docs/           architecture, API notes, roadmap
```

## Runtime Responsibilities

### `backend/`

- private PDF-processing service
- no public production hostname
- only `frontend/` should call it
- current backend proxy protection remains in place through the shared token flow

### `frontend/`

- public tool UI
- server-side proxy for `/api/*` to the private Python backend
- server-side fetch for runtime CMS config from `cms-backend/`
- renders runtime SEO, verification tags, analytics tags, and ad placements without rebuilds

### `cms-backend/`

- admin auth/session API
- published runtime config API
- draft save + publish endpoints
- release history and audit log endpoints
- Prisma/Postgres-backed draft and published content storage
- Redis-backed sessions, cache invalidation, rate limiting, and publish queue worker

### `cms-frontend/`

- admin sign-in UI
- runtime config editing UI
- publish/release view
- audit log view
- proxies admin requests to `cms-backend/`

## Public Runtime Config Flow

1. Admin edits draft runtime config in `cms-frontend/`
2. `cms-frontend/` sends the update to `cms-backend/admin/v1/runtime-config/draft`
3. Publish writes a new published document in `cms-backend/`
4. `cms-backend/` clears published cache and triggers frontend revalidation immediately
5. If immediate revalidation fails, `cms-backend/` queues retry via worker
6. `frontend/` revalidates runtime tags and starts serving updated SEO/tag/ad data without a new build

## PDF Request Flow

1. Browser submits a tool action to `frontend/`
2. `frontend/src/app/api/[...path]/route.ts` proxies the request to the private Python backend
3. `backend/` validates, processes, stores the job result, and returns the download metadata
4. `frontend/` renders the result UI back to the user

## Config Sources

### Build-time / infrastructure

Root `.env` stores:

- origins and hostnames
- service ports
- private backend token
- CMS session/revalidation secrets
- local/prod PostgreSQL and Redis placeholders

### Runtime / CMS-managed

`cms-backend/` published config stores:

- SEO defaults and route-level SEO
- Google Analytics / GTM / Bing / Search Console / Clarity / Meta Pixel IDs
- AdSense settings
- ad placements by slot/scope/category
- `ads.txt` content

## Deployment Model

- Root `docker-compose.yml` runs the local multi-app stack
- Root `docker-compose.prod.yml` runs the production-oriented stack with Traefik labels
- Root `Jenkinsfile` builds and deploys:
  - `backend`
  - `frontend`
  - `cms-backend`
  - `cms-frontend`
- PostgreSQL and Redis are intentionally external to Docker in both dev and prod

## Current Limitation

Formal load validation for high concurrency is not yet documented as a certified target. Capacity hardening should include worker tuning, queue policies, and repeatable benchmark baselines.
