# PDF Toolkit

A modular PDF platform with a private Python PDF API, a public tools frontend, and a runtime CMS layer for SEO, ads, and analytics integrations.

All configuration examples in this README are placeholders only (for example, `example.com`, `replace-*`, and local dev addresses).

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## Features

| Tool                 | Endpoint                         | Description                                                    |
| -------------------- | -------------------------------- | -------------------------------------------------------------- |
| **Merge PDF**        | `POST /api/pdf/merge`            | Combine multiple PDFs into one document                        |
| **Rotate PDF**       | `POST /api/pdf/rotate`           | Rotate all or specific pages by 90°/180°/270°                  |
| **Split PDF**        | `POST /api/pdf/split`            | Split a PDF into multiple files by page ranges                 |
| **Extract Pages**    | `POST /api/pdf/extract`          | Select specific pages and export to a new PDF                  |
| **Image to PDF**     | `POST /api/pdf/image-to-pdf`     | Convert JPG/PNG/GIF/BMP/TIFF/WebP images to PDF                |
| **Watermark PDF**    | `POST /api/pdf/watermark`        | Apply diagonal text watermark with custom settings             |
| **Rearrange Pages**  | `POST /api/pdf/rearrange`        | Reorder pages via drag-and-drop                                |
| **PDF to DOCX**      | `POST /api/pdf/pdf-to-docx`      | Convert PDF to editable DOCX (best-effort layout preservation) |
| **DOCX to PDF**      | `POST /api/pdf/docx-to-pdf`      | Convert DOCX documents to PDF                                  |
| **PDF to JPG**       | `POST /api/pdf/to-jpg`           | Convert PDF pages into JPG images (ZIP output)                 |
| **PDF to Text**      | `POST /api/pdf/to-text`          | Extract text content from PDF pages into `.txt`                |
| **Remove Metadata**  | `POST /api/pdf/remove-metadata`  | Remove document metadata from a PDF copy                       |
| **Add Page Numbers** | `POST /api/pdf/add-page-numbers` | Stamp page numbers at configurable positions                   |
| **Repair PDF**       | `POST /api/pdf/repair`           | Attempt structural repair for problematic PDFs                 |

---

## Apps

- `pdf-api/` — private FastAPI PDF processing service
- `pdf-web/` — public PDF tools site
- `cms-api/` — runtime CMS API for published config, draft/publish, and admin auth
- `cms-web/` — CMS admin UI for runtime SEO, ads, and integrations

## Tech Stack

### PDF Backend

- **Python** `3.12`
- **FastAPI** `0.116.1` — async web framework
- **pypdf** `5.9.0` — PDF manipulation
- **Pillow** `11.2.1` — image processing (Image to PDF)
- **uvicorn** `0.35.0` — ASGI server

### Frontends

- **Next.js** `16` + **React** `19` + **TypeScript** `5.9`
- **App Router** — filesystem routing and metadata handling
- **Tailwind CSS** `4` — utility-first styling
- **Runtime CMS config fetch** — published SEO, ads, analytics, and verification tags without rebuilds

### CMS Backend

- **Node.js** `22`
- **Express** `5`
- **TypeScript** `5.9`
- **Zod** `4`
- **tsup** — backend bundling
- **Prisma + PostgreSQL** — draft and published CMS persistence
- **Redis** — sessions, publish cache invalidation, queueing, and rate limiting

### Infrastructure

- **Docker** + **Docker Compose** — containerized deployment
- **Next.js standalone output** — production frontend runtime

---

## Quick Start

### Option A: Docker Compose (Recommended)

```bash
git clone <your-repository-url>
cd <your-repository-folder>

# Build and start the PDF site, private PDF API, CMS API, CMS worker, and CMS frontend
docker compose up --build -d
```

Dev Docker uses your **existing local PostgreSQL and Redis** (it does not start DB/Redis containers).  
Set these root env values before `docker compose up`:

- `DEV_DOCKER_POSTGRES_URL`
- `DEV_DOCKER_REDIS_URL`

Recommended dev pattern (inside Docker containers):

- `DEV_DOCKER_POSTGRES_URL=postgresql://<user>:<password>@host.docker.internal:5432/<db>?schema=public`
- `DEV_DOCKER_REDIS_URL=redis://:<password>@host.docker.internal:6379/0`

| Service            | URL                        |
| ------------------ | -------------------------- |
| Frontend           | http://localhost:3000      |
| Backend API        | http://localhost:8000      |
| CMS Frontend       | http://localhost:3100      |
| CMS API            | http://localhost:4100      |
| API Docs (Swagger) | http://localhost:8000/docs |

```bash
# Check health
curl http://localhost:8000/api/health

# Stop services
docker compose down
```

### Docker Dev Verification

```bash
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps -a
docker compose -f docker-compose.yml logs --tail=120
```

### CMS Migration Workflow (Important)

CMS Prisma migrations are handled manually (outside Docker Compose).
Compose files no longer include a `cms-migrate` one-off job.

After completing manual migrations, start services normally:

```bash
# Dev
docker compose -f docker-compose.yml up -d

# Prod
docker compose -f docker-compose.prod.yml up -d
```

If `cms-backend-api` is unhealthy because DB schema is missing/outdated:

```bash
# 1) Run your manual migration process

# 2) Restart cms API + worker
docker compose -f docker-compose.yml up -d cms-backend-api cms-backend-worker

# 3) Verify
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs --tail=120 cms-backend-api
```

If `cms-api` is unhealthy with `Can't reach database server`, verify that:

- local PostgreSQL is running and reachable from Docker via `host.docker.internal:5432`
- local Redis is running and reachable from Docker via `host.docker.internal:6379`
- `DEV_DOCKER_POSTGRES_URL` and `DEV_DOCKER_REDIS_URL` point to valid credentials/DB

### Option B: Local Development

### Option B: Makefile (Fastest Local Run)

```bash
make install
make dev
```

Useful targets:

```bash
make dev-pdf
make dev-cms
make build
make test
make docker-up
make docker-down
```

`make dev` runs the four local app processes concurrently with prefixed logs.

### Option C: Manual Development

#### Prerequisites

- Python `3.12+`
- Node.js `22+`
- pnpm (`npm install -g pnpm`)

#### Backend

```bash
cd pdf-api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If you start `uvicorn` from the project root instead of `pdf-api/`, use:

```bash
source pdf-api/.venv/bin/activate
uvicorn app.main:app --app-dir pdf-api --reload --reload-dir pdf-api --port 8000
```

#### Frontend

```bash
cd pdf-web
pnpm install
pnpm dev
```

The frontend dev server runs at http://localhost:3000 and proxies API requests to `http://localhost:8000`.

#### CMS Backend

```bash
cd cms-api
pnpm install
pnpm dev
```

The CMS backend runs at http://localhost:4100 and serves both admin and published runtime-config endpoints.

#### CMS Frontend

```bash
cd cms-web
pnpm install
pnpm dev
```

The CMS frontend runs at http://localhost:3100 and proxies admin requests to the CMS backend.

---

## Project Structure

```
pdf-toolkit/
├── pdf-api/
├── pdf-web/
├── cms-api/
├── cms-web/
├── infra/
├── docs/
├── docker-compose.yml
├── docker-compose.prod.yml
├── Jenkinsfile
└── .env.example
```

---

## Environment Variables

| Variable                                                           | Example                                                                                               | Description                                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `APP_DEV`                                                          | `true`                                                                                                | Backend selector. `true` loads the `DEV_*` group, `false` loads the `PROD_*` group                  |
| `NEXT_PUBLIC_APP_DEV`                                              | `true`                                                                                                | Frontend selector. Keep it in sync with `APP_DEV` so the browser and server use the same group      |
| `DEV_ALLOWED_ORIGINS` / `PROD_ALLOWED_ORIGINS`                     | `http://localhost:3000` / `https://pdf.example.com`                                                   | Browser origins allowed to call the backend                                                         |
| `DEV_ALLOWED_HOSTS` / `PROD_ALLOWED_HOSTS`                         | `localhost,127.0.0.1,pdf-api` / `pdf.example.com,localhost,127.0.0.1,pdf-api`                         | Trusted backend hostnames, including internal health-check hosts                                    |
| `DEV_TRUST_PROXY` / `PROD_TRUST_PROXY`                             | `false` / `true`                                                                                      | Whether the backend trusts forwarded proxy headers                                                  |
| `DEV_RATE_LIMIT_MAX_REQUESTS` / `PROD_RATE_LIMIT_MAX_REQUESTS`     | `60`                                                                                                  | Max requests per rate-limit window                                                                  |
| `DEV_RATE_LIMIT_WINDOW_SECONDS` / `PROD_RATE_LIMIT_WINDOW_SECONDS` | `60`                                                                                                  | Rate-limit window size in seconds                                                                   |
| `DEV_MAX_UPLOAD_MB` / `PROD_MAX_UPLOAD_MB`                         | `25`                                                                                                  | Maximum upload size per file in MB                                                                  |
| `DEV_INTERNAL_API_ORIGIN` / `PROD_INTERNAL_API_ORIGIN`             | `http://localhost:8000` / `http://pdf-api:8000`                                                       | Server-side backend target used by Next.js rewrites                                                 |
| `DEV_INTERNAL_API_TOKEN` / `PROD_INTERNAL_API_TOKEN`               | secret value                                                                                          | Shared server-only token that lets the frontend proxy reach the backend directly                    |
| `NEXT_PUBLIC_DEV_SITE_ORIGIN` / `NEXT_PUBLIC_PROD_SITE_ORIGIN`     | `http://localhost:3000` / `https://pdf.example.com`                                                   | Public tools site origin used for canonical and metadata URLs                                       |
| `PROD_PUBLIC_HOSTNAME`                                             | `pdf.example.com`                                                                                     | Production hostname used by the Traefik router in `docker-compose.prod.yml`                         |
| `DEV_CMS_API_ORIGIN` / `PROD_CMS_API_ORIGIN`                       | `http://localhost:4100` / `https://cms-api.example.com`                                               | Public CMS API origin                                                                               |
| `DEV_CMS_API_INTERNAL_ORIGIN` / `PROD_CMS_API_INTERNAL_ORIGIN`     | `http://localhost:4100` / `http://cms-api:4100`                                                       | Server-side runtime-config target used by the public frontend and CMS frontend                      |
| `DEV_CMS_WEB_ORIGIN` / `PROD_CMS_WEB_ORIGIN`                       | `http://localhost:3100` / `https://cms.example.com`                                                   | CMS admin frontend origin                                                                           |
| `DEV_CMS_REVALIDATE_SECRET` / `PROD_CMS_REVALIDATE_SECRET`         | secret value                                                                                          | Shared secret used when the CMS publishes a new runtime release and asks the frontend to revalidate |

Use one root `.env` file for every mode. Start from [`.env.example`](.env.example), then switch `APP_DEV` and `NEXT_PUBLIC_APP_DEV` together when you want direct host runs to use the prod group.

`docker-compose.yml` is pinned to the dev group. `docker-compose.prod.yml` and the Jenkins pipeline are pinned to the prod group so they do not accidentally inherit the wrong mode from your local `.env`.

---

## Deployment

Suggested production environment values:

```env
APP_DEV=false
NEXT_PUBLIC_APP_DEV=false

PROD_PUBLIC_HOSTNAME=app.example.com
PROD_ALLOWED_ORIGINS=https://app.example.com
PROD_ALLOWED_HOSTS=app.example.com,localhost,127.0.0.1,pdf-api
PROD_TRUST_PROXY=true
PROD_INTERNAL_API_ORIGIN=http://pdf-api:8000
PROD_INTERNAL_API_TOKEN=replace-with-prod-internal-token
NEXT_PUBLIC_PROD_SITE_ORIGIN=https://app.example.com
```

With this setup:

- `pdf-web/` is the only public entrypoint for PDF processing.
- Browser requests hit the Next.js app at `/api/*`, which proxies them to the private Python backend.
- `cms-api/` exposes a public read-only runtime-config surface for SEO, ads, and integrations, plus protected admin routes.
- `pdf-web/` reads published CMS config at runtime, so changes to GA/Bing/AdSense/verification settings do not require a new frontend build.

For local Docker use, the Compose file still works with localhost defaults.

---

## Publish Reliability

The CMS publish flow is protected by readiness checks:

- draft changes must exist (`hasChanges`)
- core infra checks must pass (`canPublish`)
- checks include database connectivity, Redis connectivity, and frontend revalidate endpoint reachability

When checks fail, CMS blocks publish and shows the failing check messages in the Publish page.

---

## Capacity Note (Planned)

Current codebase is production-structured, but formal concurrency certification (for example, validated `100`/`500` active user targets under load) is still planned.

Planned later:

- backend worker/process tuning for PDF-heavy endpoints
- queue/backpressure policies for expensive operations
- repeatable load test profiles and thresholds
- SLO-based regression gates in CI/CD

---

## API Reference

Full interactive documentation is available at `/docs` (Swagger UI) when the backend is running.

See [docs/api-notes.md](docs/api-notes.md) for detailed endpoint reference.

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for system design and data flow.

Per-area docs:

- [docs/README.md](docs/README.md)
- [infra/README.md](infra/README.md)
- [cms-api/README.md](cms-api/README.md)
- [cms-web/README.md](cms-web/README.md)

---

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned features and improvements.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow expectations, and contact details.

---

## License

MIT

---

## Service Checklist

Use this as a deployment and regression checklist. Mark each item before production releases.

- [x] `pdf-api` (Python API) is wired to scoped envs (`DEV_*` / `PROD_*`) for origins, limits, token, and Redis
- [x] `pdf-web` (public Next.js) proxies backend via internal origin/token and reads CMS runtime config at request-time
- [x] `cms-api` (Node API) is wired to Postgres, Redis, session/auth secrets, SMTP, publish revalidate, and runtime drafts
- [x] `cms-api` worker shares the same env contract as CMS API for publish/revalidate and background jobs
- [x] `cms-web` (admin Next.js) is wired to CMS API internal/public origins and auth flow
- [x] Docker dev compose (`docker-compose.yml`) pins `APP_DEV=true` and maps Docker-internal API/CMS/Redis/Postgres origins
- [x] Docker prod compose (`docker-compose.prod.yml`) pins `APP_DEV=false` and maps prod hostnames (`pdf`, `cms`, `cms-api`) through Traefik labels
- [x] Superadmin + admin seed envs are both present in root env contract and passed into CMS backend containers
- [x] SMTP envs are present for dev/prod and support Gmail app-password style setup
- [x] Public frontend fallback content remains active for SEO/site/legal when CMS runtime fetch fails

### DNS / Domain Mapping (Cloudflare)

- [x] `pdf.<your-domain>` -> public frontend
- [x] `cms.<your-domain>` -> CMS frontend
- [x] `cms-api.<your-domain>` -> CMS backend API

Keep SSL/TLS and proxy settings consistent with your reverse-proxy (Traefik) configuration.

### Required Secret Placement (Do not commit real values)

- [ ] Replace all `replace-*` values in root `.env` (or better, inject via secret manager in CI/CD)
- [ ] Set distinct prod secrets: `PROD_INTERNAL_API_TOKEN`, `PROD_CMS_SESSION_SECRET`, `PROD_CMS_REVALIDATE_SECRET`, `PROD_CMS_INGEST_SECRET`
- [ ] Set SMTP credentials for prod (`PROD_SMTP_USER`, `PROD_SMTP_PASSWORD`, `PROD_SMTP_FROM_ADDRESS`)
- [ ] Set `PROD_DOCKER_POSTGRES_URL` and `PROD_DOCKER_REDIS_URL` to real docker DB URLs with explicit username/password
