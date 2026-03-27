# Infrastructure Notes

This directory holds repository-level developer and deployment helpers.

All infra examples should use placeholders only for hostnames, tokens, and credentials.

## Layout

- `infra/scripts/` — helper scripts used by the root `Makefile`
- `infra/docker/` — notes about the Docker/deploy layout used by this repo

## Current Rule

The canonical compose files remain at the repo root:

- `docker-compose.yml`
- `docker-compose.prod.yml`

That keeps local `docker compose` and Jenkins usage straightforward while still giving `infra/` a place for shared operational documentation and helper scripts.
