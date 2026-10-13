# Guía de scripts (`scripts/`)

Documenta los tres scripts de shell del proyecto. Todos son `bash` con
`set -euo pipefail` (fallan rápido y ruidosamente ante cualquier error, en
vez de continuar en un estado a medias), y todos resuelven rutas relativas a
la raíz del repo (`ROOT_DIR`), así que pueden invocarse desde cualquier
directorio.

Para lo que hacen por dentro `docker compose`/Docker, ver
[docker-guide.md](./docker-guide.md).

## Resumen

| Script | Cuándo usarlo | Modifica `.env` | Idempotente |
|---|---|---|---|
| [`setup.sh`](#setupsh) | Primera vez en una máquina nueva | Sí | Sí |
| [`run.sh`](#runsh) | Día a día, para levantar/parar el proyecto en local | Solo lo crea si no existe | Sí |
| [`clear.sh`](#clearsh) | Cuando quieres borrar contenedores e imágenes locales | No | Sí |

Ninguno despliega a producción: la API la despliega Dokploy, el sitio Vercel,
y la base de datos se administra desde el portal de Azure.

## `setup.sh`

**Qué hace**: clona el repo (o actualiza el checkout existente con
`git pull --ff-only`), instala las dependencias locales de
`core/client`/`core/server` si `npm`/`dotnet` están disponibles, y crea
`.env` a partir de `.env.example` con:

- las credenciales que tú elijas para el usuario administrador,
- un `JWT_SECRET` generado al azar,
- la cadena de conexión de Azure SQL que pegues (o la dejas vacía y la
  completas luego en `.env`).

```bash
# Desde cero, en una máquina nueva:
curl -fsSL https://raw.githubusercontent.com/ArcGabicho/sistema-rpa-dds/master/scripts/setup.sh | bash

# Desde un checkout existente:
scripts/setup.sh

# Para rotar a propósito el admin y el JWT_SECRET:
scripts/setup.sh --force
```

**Variables de entorno que lee**: `REPO_URL` (por defecto el repo oficial)
y `TARGET_DIR` (por defecto `$HOME/sistema-rpa-dds`), solo relevantes para
el modo "clonar en máquina nueva" vía `curl | bash`.

**Idempotencia, en detalle**: cada vez que se ejecuta:

- Si `.env` ya existe, **no lo pisa**: solo completa lo que falte.
- Para el correo/contraseña de administrador: si `ADMIN_EMAIL`/
  `ADMIN_PASSWORD` ya tienen un valor distinto al placeholder de
  `.env.example`, no vuelve a preguntar.
- `JWT_SECRET` solo se genera (`openssl rand -base64 48`, o `/dev/urandom`
  como respaldo) si sigue siendo el placeholder. Regenerarlo en cada
  ejecución invalidaría todas las sesiones activas; `--force` existe para
  cuando sí quieres rotarlo a propósito.
- `DB_CONNECTION_STRING` solo se pregunta si está vacío, y `--force` no lo
  toca: la base se crea fuera del repo, así que el script nunca la genera.
  Se guarda entre comillas simples para que Docker Compose lea literal
  cualquier `$` o `#` de la contraseña.

**Qué NO hace**: no levanta el proyecto (para eso está `run.sh`) ni crea la
base de datos en Azure.

## `run.sh`

**Qué hace**: levanta el proyecto en local. Si `.env` no existe todavía, lo
copia de `.env.example` tal cual (con valores de ejemplo) para que pueda
arrancar sin fricción en un entorno de prueba. Antes de levantar nada,
verifica que `DB_CONNECTION_STRING` no esté vacío, porque sin base de datos
la API no arranca.

Tiene dos modos:

**Modo Docker** (por defecto): cliente y servidor en Docker Compose.

```bash
scripts/run.sh                 # equivalente a: docker compose ... up --build
scripts/run.sh -d              # igual, pero en segundo plano
scripts/run.sh down            # detiene el stack
scripts/run.sh logs -f server  # cualquier subcomando de `docker compose` funciona
```

Cualquier argumento se reenvía tal cual a `docker compose -f
docker/docker-compose.yml --env-file .env`. Si solo pasas flags (como `-d`),
se anteponen a `up --build`.

**Modo desarrollo**: el servidor en Docker y el cliente con `next dev` en tu
máquina, con recarga en caliente al editar `core/client`.

```bash
scripts/run.sh dev
```

Levanta `server` en segundo plano y espera a que pase su healthcheck,
instala las dependencias de `core/client` si faltan, y corre `npm run dev`
apuntando a la API local (`API_URL=http://localhost:$SERVER_PORT`) en el
puerto `CLIENT_PORT`. Al salir con Ctrl+C, detiene también el servidor.

## `clear.sh`

**Qué hace**: `docker compose down --rmi all --remove-orphans`: para el
stack y borra los contenedores e **imágenes** locales del proyecto. Pide
confirmación interactiva salvo que se pase `-y`.

```bash
scripts/clear.sh       # pide confirmación
scripts/clear.sh -y    # sin confirmación (útil en CI o scripts propios)
```

**No toca la base de datos**: vive en Azure SQL, así que ningún dato se
pierde al correr este script. Úsalo cuando quieras reconstruir las imágenes
desde cero.

## Flujo típico

**Primera vez:**

```bash
scripts/setup.sh   # clona (si hace falta), instala dependencias, crea .env
scripts/run.sh -d   # levanta todo en segundo plano
```

**Día a día:** `scripts/run.sh dev` mientras desarrollas el frontend, o
`scripts/run.sh` / `scripts/run.sh down` para probar el stack completo en
Docker.
