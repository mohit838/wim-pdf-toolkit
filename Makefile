SHELL := /bin/bash

.PHONY: help install install-backend install-frontend install-cms-backend install-cms-frontend \
	dev dev-pdf dev-cms build build-backend build-frontend build-cms-backend build-cms-frontend \
	test docker-up docker-down docker-logs prod-config clean

help:
	@echo "Available targets:"
	@echo "  make install            Install backend, frontend, cms-backend, and cms-frontend dependencies"
	@echo "  make dev                Run backend, frontend, cms-backend, cms-worker, and cms-frontend together"
	@echo "  make dev-pdf            Run the private PDF backend and public frontend only"
	@echo "  make dev-cms            Run cms-backend, cms-worker, and cms-frontend only"
	@echo "  make build              Build frontend, cms-backend, and cms-frontend; compile-check backend"
	@echo "  make test               Run the frontend test suite"
	@echo "  make docker-up          Start the full local Docker stack"
	@echo "  make docker-down        Stop the local Docker stack"
	@echo "  make docker-logs        Tail logs from the local Docker stack"
	@echo "  make prod-config        Render the production compose file (requires prod env values)"
	@echo "  make clean              Remove local build output"

install: install-backend install-frontend install-cms-backend install-cms-frontend

install-backend:
	@test -d pdf-api/.venv || python3 -m venv pdf-api/.venv
	@source pdf-api/.venv/bin/activate && pip install -r pdf-api/requirements.txt

install-frontend:
	@pnpm --dir pdf-web install

install-cms-backend:
	@pnpm --dir cms-api install

install-cms-frontend:
	@pnpm --dir cms-web install

dev:
	@bash infra/scripts/run-dev-stack.sh all

dev-pdf:
	@bash infra/scripts/run-dev-stack.sh pdf

dev-cms:
	@bash infra/scripts/run-dev-stack.sh cms

build: build-backend build-frontend build-cms-backend build-cms-frontend

build-backend:
	@source pdf-api/.venv/bin/activate && python -m compileall pdf-api/app

build-frontend:
	@pnpm --dir pdf-web build

build-cms-backend:
	@pnpm --dir cms-api build

build-cms-frontend:
	@pnpm --dir cms-web build

test:
	@pnpm --dir pdf-web test

docker-up:
	@docker compose up --build -d

docker-down:
	@docker compose down

docker-logs:
	@docker compose logs -f --tail=200

prod-config:
	@docker compose -f docker-compose.prod.yml config

clean:
	@rm -rf pdf-web/.next pdf-web/dist cms-api/dist cms-web/.next
