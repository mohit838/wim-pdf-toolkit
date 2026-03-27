# Docker Layout

The repo uses a single root Docker orchestration layer instead of scattering compose files inside app folders.

## Active Files

- `docker-compose.yml` — local development stack for:
  - `pdf-api/`
  - `pdf-web/`
  - `cms-api/` API
  - `cms-api/` worker
  - `cms-web/`
- `docker-compose.prod.yml` — production-oriented stack with Traefik labels and image tags
- `Jenkinsfile` — build, deploy, health-check, rollback, and image-retention workflow

## Why This Folder Exists

You asked to keep one Docker/deploy layer for all services. This folder documents that shared design even though the executable compose files stay at the repo root.

## Service Exposure Rules

- `pdf-api/` is private and must not be routed publicly.
- `pdf-web/` is public at `https://pdf.example.com`.
- `cms-web/` is public at `https://cms.example.com`.
- `cms-api/` is public at `https://cms-api.example.com` for:
  - protected admin routes
  - public published-read runtime config routes
- PostgreSQL and Redis are external to Compose in both dev and prod.
