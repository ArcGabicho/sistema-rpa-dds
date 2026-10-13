#!/usr/bin/env bash
set -euo pipefail

# Runs the project locally. Two modes:
#   scripts/run.sh [docker compose args...]
#       Client and server in Docker Compose (default: up --build), e.g.
#       scripts/run.sh -d          -> up --build in the background
#       scripts/run.sh down        -> stop the stack
#       scripts/run.sh logs -f server
#   scripts/run.sh dev
#       Server in Docker, client with `next dev` on the host (hot reload).
#       Ctrl+C stops both.
#
# Either way the API connects to the Azure SQL database in
# DB_CONNECTION_STRING — there is no local database container.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"

log() { printf '\n==> %s\n' "$1"; }
die() { echo "Error: $1" >&2; exit 1; }

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

# env_value KEY — prints KEY's value from .env, without surrounding quotes.
# .env isn't sourced because the connection string contains ';'.
env_value() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n1 | sed -e "s/^'\(.*\)'$/\1/" -e 's/^"\(.*\)"$/\1/'
}

require_connection_string() {
  [ -n "$(env_value DB_CONNECTION_STRING)" ] \
    || die "Falta DB_CONNECTION_STRING en .env (la cadena de conexión de Azure SQL)."
}

if [ ! -f "$ENV_FILE" ]; then
  echo "No se encontró .env, copiando desde .env.example con valores de ejemplo."
  echo "Para producción, usa scripts/setup.sh en su lugar."
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
fi

if [ "${1:-}" = "dev" ]; then
  command -v npm > /dev/null 2>&1 || die "Falta 'npm'. Instálalo antes de continuar."
  require_connection_string

  log "Levantando el servidor en Docker..."
  compose up -d --build --wait server
  trap 'log "Deteniendo el servidor..."; compose stop server' EXIT

  cd "$ROOT_DIR/core/client"
  if [ ! -d node_modules ]; then
    log "Instalando dependencias de core/client..."
    npm install
  fi

  server_port="$(env_value SERVER_PORT)"
  client_port="$(env_value CLIENT_PORT)"

  log "Levantando el cliente con next dev..."
  API_URL="http://localhost:${server_port:-8080}" \
    JWT_SECRET="$(env_value JWT_SECRET)" \
    npm run dev -- --port "${client_port:-3000}"
  exit 0
fi

# No args, or only flags (e.g. -d): default to bringing the stack up.
if [ "$#" -eq 0 ] || [[ "$1" == -* ]]; then
  set -- up --build "$@"
fi

[ "$1" != "up" ] || require_connection_string

compose "$@"
