#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

DEPLOY_ENV_FILE="${1:-.env}"

if [ ! -f "$DEPLOY_ENV_FILE" ]; then
  echo "Env file not found: $DEPLOY_ENV_FILE" >&2
  exit 1
fi

echo "Running CMS Prisma migrations with env file: $DEPLOY_ENV_FILE"
docker run --rm \
  --env-file "$DEPLOY_ENV_FILE" \
  -e APP_DEV=false \
  -v "$ROOT_DIR/cms-backend:/app" \
  -w /app \
  node:22-alpine sh -lc '
    corepack enable &&
    corepack prepare pnpm@latest --activate &&
    pnpm install --no-frozen-lockfile &&
    pnpm prisma:migrate:deploy
  '
