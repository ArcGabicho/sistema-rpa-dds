# Guía de scripts (`scripts/`)

Documenta los cinco scripts de shell del proyecto. Todos son
`bash` con `set -euo pipefail` (fallan rápido y ruidosamente ante cualquier
error, en vez de continuar en un estado a medias), y todos resuelven rutas
relativas a la raíz del repo (`ROOT_DIR`), así que pueden invocarse desde
cualquier directorio.

Para lo que hacen por dentro `docker compose`/Docker, ver
[docker-guide.md](./docker-guide.md).

## Resumen

| Script | Cuándo usarlo | Modifica `.env` | Idempotente |
|---|---|---|---|
| [`setup.sh`](#setupsh) | Primera vez en una máquina nueva (local o servidor) | Sí | Sí |
| [`run.sh`](#runsh) | Día a día, para levantar/parar el stack local | No | Sí |
| [`clear.sh`](#clearsh) | Cuando quieres borrar todo y empezar de cero | No | Sí |
| [`compile-templates.sh`](#compile-templatessh) | Después de editar cualquier `infra/templates/*.bicep` | No | Sí |
| [`deploy.sh`](#deploysh) | Para desplegar el stack a Azure | No (solo lee) | Sí |

## `setup.sh`

**Qué hace**: clona el repo (o actualiza el checkout existente con
`git pull --ff-only`), instala las dependencias locales de
`core/client`/`core/server` si `npm`/`dotnet` están disponibles, y crea
`.env` a partir de `.env.example` con las credenciales que tú elijas para
el usuario administrador.

```bash
# Desde cero, en un servidor nuevo:
curl -fsSL https://raw.githubusercontent.com/ArcGabicho/sistema-rpa-dds/master/scripts/setup.sh | bash

# Desde un checkout existente:
scripts/setup.sh

# Para rotar a propósito el admin y todos los secretos generados:
scripts/setup.sh --force
```

**Variables de entorno que lee**: `REPO_URL` (por defecto el repo oficial)
y `TARGET_DIR` (por defecto `$HOME/sistema-rpa-dds`) — solo relevantes para
el modo "clonar en máquina nueva" vía `curl | bash`.

**Idempotencia, en detalle**: es el punto más importante de este script.
Cada vez que se ejecuta:

- Si `.env` ya existe, **no lo pisa** — solo completa lo que falte.
- Para el correo/contraseña de administrador: si `ADMIN_EMAIL`/
  `ADMIN_PASSWORD` ya tienen un valor distinto al placeholder de
  `.env.example`, no vuelve a preguntar — solo avisa que ya están
  configurados.
- Para los secretos generados (`MSSQL_SA_PASSWORD`, `APP_DB_PASSWORD`,
  `JWT_SECRET`): mismo criterio, solo genera uno nuevo (`openssl rand
  -base64 48`, o `/dev/urandom` como respaldo si `openssl` no está
  disponible) si el valor actual sigue siendo el placeholder.

Esto importa porque una implementación anterior de este script
regeneraba los tres secretos en *cada* ejecución — lo que significa que
volver a correrlo contra un despliegue ya en marcha (por ejemplo, para
traer el código más reciente con `git pull`) rotaba silenciosamente
`JWT_SECRET`, invalidando todas las sesiones activas, y `MSSQL_SA_PASSWORD`/
`APP_DB_PASSWORD`, dejando el contenedor de base de datos (que ya se había
inicializado con las contraseñas viejas) sin poder autenticarse más. El
flag `--force` existe exactamente para el caso en el que sí quieres ese
comportamiento a propósito (rotar todo).

**Qué NO hace**: no levanta el stack — para eso está `run.sh`. Tampoco
toca ninguna infraestructura de Azure.

## `run.sh`

**Qué hace**: levanta el stack local completo (`docker compose up --build`
por defecto) usando `docker/docker-compose.yml` y `.env`. Si `.env` no
existe todavía, lo copia de `.env.example` tal cual (con valores de
ejemplo, no aptos para producción) para que el stack pueda arrancar sin
fricción en un entorno de prueba.

```bash
scripts/run.sh              # equivalente a: docker compose ... up --build
scripts/run.sh -d            # igual, pero en segundo plano
scripts/run.sh down          # detiene el stack (conserva volúmenes)
scripts/run.sh logs -f server  # cualquier subcomando de `docker compose` funciona
```

Cualquier argumento que le pases se reenvía tal cual a `docker compose -f
docker/docker-compose.yml --env-file .env`, así que el script es
esencialmente un atajo que no obliga a recordar esas dos rutas cada vez.

## `clear.sh`

**Qué hace**: `docker compose down --rmi all --volumes --remove-orphans`
— para el stack y borra contenedores, **imágenes** y **volúmenes** del
proyecto (incluida la base de datos completa). Pide confirmación
interactiva salvo que se pase `-y`.

```bash
scripts/clear.sh       # pide confirmación
scripts/clear.sh -y    # sin confirmación (útil en CI o scripts propios)
```

Úsalo cuando quieras un estado verdaderamente limpio — por ejemplo, después
de cambiar contraseñas en `.env` y necesitar que SQL Server se reinicialice
con las nuevas (ver la sección de problemas comunes en la guía de Docker).
**Esto borra datos de forma irreversible**; no hay forma de recuperar el
volumen `mssql_data` después.

## `compile-templates.sh`

**Qué hace**: compila cada plantilla Bicep de `infra/templates/*.bicep` a
ARM JSON y guarda el resultado en `core/server/Templates/`, que es de
donde el backend las lee en runtime (como contenido publicado normal,
sin necesitar el compilador de Bicep instalado en el servidor — ver
`ImplementacionService.cs`).

```bash
scripts/compile-templates.sh
```

Busca primero `bicep` en el `PATH`; si no lo encuentra, usa
`az bicep build` como alternativa. Falla con un mensaje claro si ninguno
de los dos está instalado.

**Cuándo correrlo**: cada vez que edites cualquier archivo bajo
`infra/templates/`. El job `infra` de CI (`.github/workflows/ci.yml`)
recompila las plantillas a un directorio temporal y compara contra lo que
hay en `core/server/Templates/` — si no coinciden, el build falla con un
mensaje pidiendo correr este script y commitear el resultado. Es decir: el
JSON compilado se versiona en el repo a propósito (no se genera en el
Dockerfile del servidor), y CI existe para detectar cuando alguien edita
el `.bicep` fuente y se olvida de recompilar.

## `deploy.sh`

**Qué hace**: despliega el stack completo a Azure. Requiere `az` (Azure
CLI) y `docker` instalados, y un `.env` ya configurado (por `setup.sh`).

Pasos, en orden:

1. Verifica que estés logueado en Azure (`az login` interactivo si no).
2. Crea el resource group si no existe (`az group create`, idempotente).
3. Aplica `infra/main.bicep` vía `az deployment group create`, pasándole
   como parámetros los mismos secretos que ya usa el stack local
   (`MSSQL_SA_PASSWORD` → contraseña del admin de Azure SQL,
   `APP_DB_PASSWORD` → login de aplicación dedicado, `JWT_SECRET`,
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` → mismo usuario administrador sembrado).
   Esto crea o actualiza: Container Registry, Azure SQL, Key Vault,
   Container Apps Environment, y las dos Container Apps (cliente y
   servidor).
4. Construye las imágenes Docker de cliente y servidor localmente, y las
   sube al Container Registry recién creado/existente.
5. Actualiza explícitamente ambas Container Apps para que usen la imagen
   recién subida (`az containerapp update --image ...`) — esto es
   necesario porque Container Apps no arranca una revisión nueva por sí
   solo cuando el tag de la imagen no cambia (se usa siempre `:latest`).

```bash
scripts/deploy.sh
```

**Variables de entorno que lee** (de `.env`, con valores por defecto si
faltan): `AZURE_RESOURCE_GROUP` (`rg-dds`), `AZURE_LOCATION` (`eastus`),
`AZURE_ENVIRONMENT_NAME` (`dds`), `SQL_ADMIN_LOGIN` (`ddsadmin`), además de
los secretos ya mencionados. Falla temprano con un mensaje claro si falta
alguno de los secretos requeridos (`MSSQL_SA_PASSWORD`, `APP_DB_PASSWORD`,
`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).

**Idempotencia**: correrlo de nuevo reconcilia los mismos recursos en su
lugar (Bicep en modo incremental) y despliega lo último que se acaba de
construir — nunca recrea la base de datos ni rota secretos por su cuenta.

**Qué NO hace**: no compila las plantillas de `infra/templates/` (eso es
`compile-templates.sh`, y su resultado ya debe estar commiteado antes de
desplegar) ni crea usuarios de Azure — asume que quien lo ejecuta ya tiene
permisos suficientes (Owner, o Contributor + User Access Administrator,
porque el propio `main.bicep` asigna roles) en la suscripción de destino.

## Flujo típico

**Desarrollo local, primera vez:**

```bash
scripts/setup.sh   # clona (si hace falta), instala dependencias, crea .env
scripts/run.sh -d   # levanta todo en segundo plano
```

**Desarrollo local, día a día:** `scripts/run.sh` / `scripts/run.sh down`.

**Desplegar a producción (Azure), primera vez:**

```bash
scripts/setup.sh                 # asegura que .env tiene todos los secretos
scripts/compile-templates.sh     # si tocaste infra/templates/*.bicep
scripts/deploy.sh                # aplica main.bicep, construye y publica imágenes
```

**Volver a desplegar tras un cambio de código:** solo `scripts/deploy.sh`
de nuevo (reconstruye y publica las imágenes, reconcilia la infra sin
tocar datos ni secretos existentes).
