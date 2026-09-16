#!/usr/bin/env bash
set -euo pipefail

# Remote setup script: clones the repo onto a fresh machine, installs local
# dependencies, and creates .env from .env.example with the credentials you
# choose for the seeded admin user. Meant to be run once per server, e.g.:
#   curl -fsSL https://raw.githubusercontent.com/ArcGabicho/sistema-rpa-dds/master/scripts/setup.sh | bash
# or, from an existing clone:
#   scripts/setup.sh

REPO_URL="${REPO_URL:-https://github.com/ArcGabicho/sistema-rpa-dds.git}"
TARGET_DIR="${TARGET_DIR:-$HOME/sistema-rpa-dds}"

log()  { printf '\n==> %s\n' "$1"; }
warn() { printf 'Advertencia: %s\n' "$1" >&2; }

require() {
  if ! command -v "$1" > /dev/null 2>&1; then
    echo "Falta '$1'. Instálalo antes de continuar." >&2
    exit 1
  fi
}

random_secret() {
  # 48 random bytes, base64-encoded, no line breaks.
  openssl rand -base64 48 2>/dev/null | tr -d '\n' || head -c 64 /dev/urandom | base64 | tr -d '\n'
}

prompt() {
  local label="$1" default="$2" reply
  read -r -p "$label [$default]: " reply
  echo "${reply:-$default}"
}

prompt_secret() {
  local label="$1" reply
  read -r -s -p "$label: " reply
  echo >&2
  echo "$reply"
}

set_env_var() {
  # set_env_var FILE KEY VALUE — replaces KEY=... in FILE, or appends it.
  local file="$1" key="$2" value="$3"
  local escaped
  escaped=$(printf '%s' "$value" | sed -e 's/[\/&]/\\&/g')
  if grep -q "^${key}=" "$file"; then
    sed -i "s/^${key}=.*/${key}=${escaped}/" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

require git
require docker

# 1. Clone (or reuse) the repository.
if [ -d "$TARGET_DIR/.git" ]; then
  log "El repositorio ya existe en $TARGET_DIR, actualizando..."
  git -C "$TARGET_DIR" pull --ff-only
else
  log "Clonando $REPO_URL en $TARGET_DIR..."
  git clone "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"

# 2. Install local dependencies (useful for development outside Docker;
#    the Docker images install their own dependencies during the build).
if command -v npm > /dev/null 2>&1; then
  log "Instalando dependencias de core/client..."
  (cd core/client && npm install)
else
  warn "npm no está instalado; omitiendo dependencias de core/client."
fi

if command -v dotnet > /dev/null 2>&1; then
  log "Restaurando dependencias de core/server..."
  (cd core/server && dotnet restore)
else
  warn "dotnet no está instalado; omitiendo dependencias de core/server."
fi

# 3. Create .env from .env.example.
if [ -f .env ]; then
  warn ".env ya existe, se editará en el lugar."
else
  cp .env.example .env
fi

log "Configura el usuario administrador de la aplicación:"
admin_email=$(prompt "Correo del administrador" "admin@dds.pe")
while true; do
  admin_password=$(prompt_secret "Contraseña del administrador (mín. 8 caracteres)")
  admin_password_confirm=$(prompt_secret "Confirma la contraseña")
  if [ "$admin_password" != "$admin_password_confirm" ]; then
    echo "Las contraseñas no coinciden, intenta de nuevo." >&2
    continue
  fi
  if [ "${#admin_password}" -lt 8 ]; then
    echo "La contraseña debe tener al menos 8 caracteres." >&2
    continue
  fi
  break
done
admin_name=$(prompt "Nombre completo del administrador" "Administrador")

set_env_var .env ADMIN_EMAIL "$admin_email"
set_env_var .env ADMIN_PASSWORD "$admin_password"
set_env_var .env ADMIN_FULL_NAME "$admin_name"

log "Generando secretos aleatorios para la base de datos y los tokens de sesión..."
set_env_var .env MSSQL_SA_PASSWORD "$(random_secret)"
set_env_var .env APP_DB_PASSWORD "$(random_secret)"
set_env_var .env JWT_SECRET "$(random_secret)"

log "Listo. Revisa $TARGET_DIR/.env y luego ejecuta scripts/run.sh para levantar el stack."
