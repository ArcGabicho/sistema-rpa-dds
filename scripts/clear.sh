#!/usr/bin/env bash
set -euo pipefail

# Stops the local stack and removes its containers, images and volumes —
# including the local development database. The Azure SQL database is never
# touched by this script.
# Usage: scripts/clear.sh [-y]   (-y skips the confirmation prompt)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"
[ -f "$ENV_FILE" ] || ENV_FILE="$ROOT_DIR/.env.example"

if [ "${1:-}" != "-y" ]; then
  read -r -p "Esto eliminará los contenedores, imágenes y volúmenes locales del proyecto, incluida la base de datos de desarrollo (la de Azure no se toca). ¿Continuar? [y/N] " reply
  case "$reply" in
    [yY]*) ;;
    *) echo "Cancelado."; exit 0 ;;
  esac
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --rmi all --volumes --remove-orphans

echo "Contenedores, imágenes y volúmenes del proyecto eliminados."
