#!/usr/bin/env bash
set -euo pipefail

# Compiles the implementación Bicep templates (infra/templates/*.bicep) into
# ARM JSON and copies them into core/server/Templates/, where the backend
# loads them at runtime (as regular published content, no Bicep tooling
# needed on the server itself). Run this whenever infra/templates/*.bicep
# changes. Usage: scripts/compile-templates.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/infra/templates"
OUT_DIR="$ROOT_DIR/core/server/Templates"

log() { printf '\n==> %s\n' "$1"; }
die() { echo "Error: $1" >&2; exit 1; }

if command -v bicep > /dev/null 2>&1; then
  BICEP_BUILD=(bicep build)
elif command -v az > /dev/null 2>&1; then
  BICEP_BUILD=(az bicep build --file)
else
  die "No se encontró 'bicep' ni 'az' en el PATH. Instala el compilador de Bicep antes de continuar."
fi

mkdir -p "$OUT_DIR"

for bicep_file in "$SRC_DIR"/*.bicep; do
  name="$(basename "$bicep_file" .bicep)"
  out_file="$OUT_DIR/$name.json"
  log "Compilando $name.bicep..."
  "${BICEP_BUILD[@]}" "$bicep_file" --outfile "$out_file"
done

log "Listo. Plantillas compiladas en $OUT_DIR."
