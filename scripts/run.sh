#!/usr/bin/env bash
set -euo pipefail

# Starts the full stack (client, server, SQL Server) locally with Docker
# Compose. Usage: scripts/run.sh [docker compose args...]
# e.g. scripts/run.sh -d   -> run in the background
#      scripts/run.sh down -> stop the stack

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "No se encontró .env, copiando desde .env.example con valores de ejemplo."
  echo "Para producción, usa scripts/setup.sh en su lugar."
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
fi

if [ "$#" -eq 0 ]; then
  set -- up --build
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
