#!/usr/bin/env bash
set -euo pipefail

# Deploys the stack to Azure: builds and pushes the client/server images,
# applies infra/main.bicep (Container Registry, Azure SQL, Key Vault,
# Container Apps Environment, and the two container apps), then rolls the
# freshly pushed images out.
#
# Idempotent: re-running it reconciles the same resources in place and
# updates both container apps to whatever images were just built — it never
# recreates the database or rotates secrets. Reads its secrets from the
# repo's .env (see scripts/setup.sh), so run that first.
#
# Usage: scripts/deploy.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-dds}"
AZURE_LOCATION="${AZURE_LOCATION:-eastus}"
AZURE_ENVIRONMENT_NAME="${AZURE_ENVIRONMENT_NAME:-dds}"
SQL_ADMIN_LOGIN="${SQL_ADMIN_LOGIN:-ddsadmin}"

log()  { printf '\n==> %s\n' "$1"; }
die()  { echo "Error: $1" >&2; exit 1; }

require() {
  command -v "$1" > /dev/null 2>&1 || die "Falta '$1'. Instálalo antes de continuar."
}

require az
require docker

[ -f "$ENV_FILE" ] || die "No se encontró .env. Ejecuta scripts/setup.sh primero."
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

for var in MSSQL_SA_PASSWORD APP_DB_PASSWORD JWT_SECRET ADMIN_EMAIL ADMIN_PASSWORD; do
  [ -n "${!var:-}" ] || die "Falta $var en .env. Ejecuta scripts/setup.sh primero."
done

# 1. Make sure we're logged in and know which subscription we're deploying to.
if ! az account show > /dev/null 2>&1; then
  log "No has iniciado sesión en Azure, abriendo az login..."
  az login > /dev/null
fi
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
log "Desplegando en la suscripción: $SUBSCRIPTION_NAME"

# 2. Resource group (idempotent).
log "Verificando el grupo de recursos $AZURE_RESOURCE_GROUP en $AZURE_LOCATION..."
az group create \
  --name "$AZURE_RESOURCE_GROUP" \
  --location "$AZURE_LOCATION" \
  --output none

# 3. Infra deployment, pass 1: creates/updates everything (Container Registry,
#    Azure SQL, Key Vault, Container Apps Environment and both container
#    apps). On a brand-new environment the apps briefly reference an image
#    tag that doesn't exist in the registry yet — that's expected, step 5
#    below rolls the real image out right after.
log "Aplicando infra/main.bicep..."
az deployment group create \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --template-file "$ROOT_DIR/infra/main.bicep" \
  --parameters \
    environmentName="$AZURE_ENVIRONMENT_NAME" \
    sqlAdminLogin="$SQL_ADMIN_LOGIN" \
    sqlAdminPassword="$MSSQL_SA_PASSWORD" \
    appDbLogin="${APP_DB_USER:-dds_app}" \
    appDbPassword="$APP_DB_PASSWORD" \
    sqlDatabaseName="${APP_DB_NAME:-DdsDb}" \
    jwtSecret="$JWT_SECRET" \
    adminEmail="$ADMIN_EMAIL" \
    adminPassword="$ADMIN_PASSWORD" \
    adminFullName="${ADMIN_FULL_NAME:-Administrador}" \
  --output none

deployment_output() {
  az deployment group show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name main \
    --query "properties.outputs.$1.value" \
    -o tsv
}

ACR_NAME=$(deployment_output acrName)
ACR_LOGIN_SERVER=$(deployment_output acrLoginServer)
CLIENT_APP_NAME=$(deployment_output clientAppName)
SERVER_APP_NAME=$(deployment_output serverAppName)

# 4. Build and push the images.
log "Iniciando sesión en $ACR_LOGIN_SERVER..."
az acr login --name "$ACR_NAME" --output none

log "Construyendo la imagen del cliente..."
docker build -f "$ROOT_DIR/docker/Dockerfile.client" -t "$ACR_LOGIN_SERVER/dds-client:latest" "$ROOT_DIR"
log "Construyendo la imagen del servidor..."
docker build -f "$ROOT_DIR/docker/Dockerfile.server" -t "$ACR_LOGIN_SERVER/dds-server:latest" "$ROOT_DIR"

log "Subiendo imágenes a $ACR_LOGIN_SERVER..."
docker push "$ACR_LOGIN_SERVER/dds-client:latest"
docker push "$ACR_LOGIN_SERVER/dds-server:latest"

# 5. Roll the freshly pushed images out. Container Apps doesn't start a new
#    revision on its own when the image tag string is unchanged ("latest"),
#    so this explicit update is what actually deploys the new build.
log "Actualizando $SERVER_APP_NAME..."
az containerapp update \
  --name "$SERVER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --image "$ACR_LOGIN_SERVER/dds-server:latest" \
  --output none

log "Actualizando $CLIENT_APP_NAME..."
az containerapp update \
  --name "$CLIENT_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --image "$ACR_LOGIN_SERVER/dds-client:latest" \
  --output none

CLIENT_URL=$(deployment_output clientUrl)
log "Listo. Sitio disponible en: $CLIENT_URL"
