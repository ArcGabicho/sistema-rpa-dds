#!/usr/bin/env bash
set -euo pipefail

# Stops the local stack and removes its containers and images. The database
# lives in Azure SQL and is never touched by this script.
# Usage: scripts/clear.sh [-y]   (-y skips the confirmation prompt)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"
[ -f "$ENV_FILE" ] || ENV_FILE="$ROOT_DIR/.env.example"

if [ "${1:-}" != "-y" ]; then
  read -r -p "Esto eliminará los contenedores e imágenes locales del proyecto (la base de datos en Azure no se toca). ¿Continuar? [y/N] " reply
  case "$reply" in
    [yY]*) ;;
    *) echo "Cancelado."; exit 0 ;;
  esac
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --rmi all --remove-orphans

echo "Contenedores e imágenes del proyecto eliminados."
