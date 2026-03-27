# Docker Layout

The repo uses a single root Docker orchestration layer instead of scattering compose files inside app folders.

## Active Files

- `docker-compose.yml` — local development stack for:
  - `backend/`
  - `frontend/`
  - `cms-backend/` API
  - `cms-backend/` worker
  - `cms-frontend/`
- `docker-compose.prod.yml` — production-oriented stack with Traefik labels and image tags
- `Jenkinsfile` — build, deploy, health-check, rollback, and image-retention workflow

## Why This Folder Exists

You asked to keep one Docker/deploy layer for all services. This folder documents that shared design even though the executable compose files stay at the repo root.

## Service Exposure Rules

- `backend/` is private and must not be routed publicly.
- `frontend/` is public at `pdf.mohitul-islam.com`.
- `cms-frontend/` is public at `cms.mohitul-islam.com`.
- `cms-backend/` is public at `cms-api.mohitul-islam.com` for:
  - protected admin routes
  - public published-read runtime config routes
- PostgreSQL and Redis are external to Compose in both dev and prod.
