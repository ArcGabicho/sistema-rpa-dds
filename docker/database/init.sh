#!/usr/bin/env bash
set -euo pipefail

# Runs against an already-running SQL Server container to create the app
# database, login and permissions (docker/database/init.sql). SQL Server's
# image has no docker-entrypoint-initdb.d convention, so this is meant to run
# as its own short-lived service in docker-compose after the db is healthy.

SQLCMD=""
SQLCMD_TRUST_FLAG=""
if [ -x /opt/mssql-tools18/bin/sqlcmd ]; then
  SQLCMD=/opt/mssql-tools18/bin/sqlcmd
  # sqlcmd 18+ encrypts by default and needs an explicit trust flag for the
  # server's self-signed certificate.
  SQLCMD_TRUST_FLAG="-C"
elif [ -x /opt/mssql-tools/bin/sqlcmd ]; then
  SQLCMD=/opt/mssql-tools/bin/sqlcmd
fi

if [ -z "$SQLCMD" ]; then
  echo "No se encontró sqlcmd en la imagen." >&2
  exit 1
fi

: "${DB_HOST:?Falta DB_HOST}"
: "${MSSQL_SA_PASSWORD:?Falta MSSQL_SA_PASSWORD}"
: "${APP_DB_NAME:?Falta APP_DB_NAME}"
: "${APP_DB_USER:?Falta APP_DB_USER}"
: "${APP_DB_PASSWORD:?Falta APP_DB_PASSWORD}"

echo "Esperando a que SQL Server (${DB_HOST}) acepte conexiones..."
attempt=0
until "$SQLCMD" -S "$DB_HOST" -U sa -P "$MSSQL_SA_PASSWORD" $SQLCMD_TRUST_FLAG -Q "SELECT 1" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "SQL Server no respondió a tiempo." >&2
    exit 1
  fi
  sleep 2
done

echo "Aplicando init.sql (base de datos, login y permisos de la aplicación)..."
"$SQLCMD" -S "$DB_HOST" -U sa -P "$MSSQL_SA_PASSWORD" $SQLCMD_TRUST_FLAG \
  -v AppDbName="$APP_DB_NAME" AppLogin="$APP_DB_USER" AppPassword="$APP_DB_PASSWORD" \
  -i /scripts/init.sql

echo "Listo: base de datos '$APP_DB_NAME' y login '$APP_DB_USER' configurados."
