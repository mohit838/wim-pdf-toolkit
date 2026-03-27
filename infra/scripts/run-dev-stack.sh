#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${1:-all}"

if [[ ! -d "${ROOT_DIR}/pdf-api/.venv" ]]; then
  echo "[error] pdf-api/.venv is missing. Run 'make install-backend' first." >&2
  exit 1
fi

command -v pnpm >/dev/null 2>&1 || {
  echo "[error] pnpm is required." >&2
  exit 1
}

PIDS=()

cleanup() {
  trap - EXIT INT TERM
  for pid in "${PIDS[@]:-}"; do
    kill "${pid}" 2>/dev/null || true
  done
  wait || true
}

trap cleanup EXIT INT TERM

run_service() {
  local name="$1"
  local cmd="$2"

  (
    cd "${ROOT_DIR}"
    stdbuf -oL -eL bash -lc "${cmd}" 2>&1 | sed -u "s/^/[${name}] /"
  ) &

  PIDS+=("$!")
}

case "${MODE}" in
  all)
    run_service "backend" "source pdf-api/.venv/bin/activate && uvicorn app.main:app --app-dir pdf-api --reload --reload-dir pdf-api --host 0.0.0.0 --port 8000"
    run_service "frontend" "pnpm --dir pdf-web dev"
    run_service "cms-api" "pnpm --dir cms-api dev"
    run_service "cms-worker" "pnpm --dir cms-api dev:worker"
    run_service "cms-web" "pnpm --dir cms-web dev"
    ;;
  pdf)
    run_service "backend" "source pdf-api/.venv/bin/activate && uvicorn app.main:app --app-dir pdf-api --reload --reload-dir pdf-api --host 0.0.0.0 --port 8000"
    run_service "frontend" "pnpm --dir pdf-web dev"
    ;;
  cms)
    run_service "cms-api" "pnpm --dir cms-api dev"
    run_service "cms-worker" "pnpm --dir cms-api dev:worker"
    run_service "cms-web" "pnpm --dir cms-web dev"
    ;;
  *)
    echo "[error] Unknown mode '${MODE}'. Use: all | pdf | cms" >&2
    exit 1
    ;;
esac

echo "[info] Running dev stack mode '${MODE}'. Press Ctrl+C to stop everything."
wait
