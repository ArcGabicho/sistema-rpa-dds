# Guía de Docker

Documenta todo lo que vive bajo `docker/`: las cuatro imágenes/servicios que
componen el stack local (`docker-compose.yml`), los dos Dockerfiles
(`Dockerfile.client`, `Dockerfile.server`) y el script de inicialización de
base de datos (`docker/database/`). Para los scripts que envuelven estos
comandos (`scripts/run.sh`, `scripts/clear.sh`, etc.), ver
[bash-scripts-guide.md](./bash-scripts-guide.md).

## Visión general

```
docker/
├── Dockerfile.client      # build de core/client (Next.js)
├── Dockerfile.server      # build de core/server (ASP.NET Core)
├── docker-compose.yml     # orquesta los 4 servicios
└── database/
    ├── init.sh            # espera a SQL Server y aplica init.sql
    └── init.sql            # crea la base, el login de la app y sus permisos
```

`docker-compose.yml` levanta cuatro servicios, en este orden de dependencias:

```
sqlserver ──► db-init ──► server ──► client
 (healthy)   (termina y     (healthy)
              sale con 0)
```

- **`sqlserver`**: el motor de base de datos.
- **`db-init`**: un contenedor de un solo uso que crea la base de datos y el
  login de la aplicación, y luego termina.
- **`server`**: la API de ASP.NET Core.
- **`client`**: el sitio Next.js, que es el único punto de entrada expuesto
  al usuario final (habla con `server` internamente, dentro de la red
  `dds`).

Todos los servicios comparten una red interna (`dds`) y las credenciales se
inyectan como variables de entorno leídas desde `.env` (ver
[`.env.example`](../.env.example) para la lista completa con comentarios).
Ninguna contraseña ni secreto está escrito en el `docker-compose.yml` ni en
ningún Dockerfile — todos vienen de `${VARIABLE}` resuelta contra `.env`.

## Los servicios

### `sqlserver`

Imagen oficial `mcr.microsoft.com/mssql/server:2022-latest`. Solo necesita
`ACCEPT_EULA=Y` y `MSSQL_SA_PASSWORD` (la contraseña del login `sa`, usada
**solo** por `db-init` para crear el login real de la aplicación — la API
nunca se conecta como `sa`, ver más abajo).

Persiste sus datos en el volumen nombrado `mssql_data`, así que la base de
datos sobrevive a `docker compose down` (pero no a `scripts/clear.sh`, que
borra volúmenes a propósito — ver la guía de scripts).

El healthcheck prueba `sqlcmd` en dos rutas posibles
(`/opt/mssql-tools18/bin/sqlcmd` o `/opt/mssql-tools/bin/sqlcmd`, según la
versión de la imagen) porque la ubicación del binario cambió entre versiones
de la imagen oficial; probar ambas hace el healthcheck robusto a ese cambio
sin tener que fijar una versión exacta de imagen.

### `db-init`

SQL Server no tiene una convención `docker-entrypoint-initdb.d` como otras
imágenes de base de datos (Postgres, MySQL), así que la inicialización se
modela como su propio servicio de un solo uso: usa la misma imagen de SQL
Server (porque ya trae `sqlcmd`), monta `docker/database/` como `/scripts`
de solo lectura, y su `entrypoint` corre `init.sh` en vez del motor de base
de datos.

`depends_on: sqlserver: condition: service_healthy` asegura que no arranca
hasta que el healthcheck de `sqlserver` pase. A su vez, `server` depende de
`db-init` con `condition: service_completed_successfully` — es decir, el
API no arranca hasta que `db-init` haya terminado (con código de salida 0),
no solo hasta que haya *empezado*.

Ver la sección [`docker/database/`](#dockerdatabase) más abajo para el
detalle de qué hace `init.sh`/`init.sql`.

### `server`

Se construye desde `docker/Dockerfile.server` con contexto de build la raíz
del repo (`context: ..`), porque necesita poder referenciar tanto
`core/server/` como, en el futuro, otros directorios del monorepo.

Variables de entorno relevantes (todas mapeadas 1:1 a `appsettings.json`
vía la convención `Seccion__Clave` de ASP.NET Core):

| Variable | Sección en appsettings | Notas |
|---|---|---|
| `ConnectionStrings__Default` | `ConnectionStrings:Default` | Armada en el propio compose file a partir de `APP_DB_*`, apuntando al login de la app, nunca a `sa`. |
| `Jwt__Secret`, `Jwt__ExpiresInMinutes` | `Jwt:*` | Firma de los JWT de sesión. |
| `Admin__Email`, `Admin__Password`, `Admin__FullName` | `Admin:*` | Usuario administrador sembrado en el primer arranque si no existe ninguno (`AdminSeeder.cs`). |
| `Cors__AllowedOrigins__0` | `Cors:AllowedOrigins` | Origen desde el que el cliente puede llamar a la API. |
| `Azure__SubscriptionId`, `Azure__ResourceGroupName`, `Azure__Location`, `Azure__KeyVaultName`, `Azure__ContainerAppsEnvironmentName` | `Azure:*` | Usadas por el módulo de Implementaciones para desplegar recursos en Azure. Vacías por defecto: sin ellas, el resto de la app (auth, clientes) funciona igual, y solo el deploy de una implementación falla de forma controlada. |

El healthcheck pega a `GET /health` (mapeado en `Program.cs`) cada 10s.
`client` no arranca hasta que este healthcheck pase.

### `client`

Se construye desde `docker/Dockerfile.client`, también con contexto en la
raíz del repo. Solo necesita `API_URL` (apuntando al servicio `server` por
su nombre de red interna, `http://server:8080` — no `localhost`, ya que
corren en contenedores distintos) y `JWT_SECRET` (para poder *verificar*
localmente el JWT en `proxy.ts`, sin tener que llamar a la API en cada
request protegida).

## Los Dockerfiles

Ambos son builds multi-stage: una etapa que compila con las herramientas de
desarrollo completas, y una etapa final mínima que solo contiene lo
necesario para ejecutar, corriendo como un usuario sin privilegios (nunca
`root`).

### `Dockerfile.client`

```
deps      → npm ci (con package-lock.json, instala exactamente lo fijado)
builder   → copia el código y corre `npm run build`
runner    → imagen final: solo el output "standalone" de Next.js
```

El `next.config.ts` del proyecto tiene `output: "standalone"`, que hace que
`next build` genere un `server.js` autocontenido con únicamente las
dependencias de producción realmente usadas — así la imagen final no
necesita `node_modules` completo ni el código fuente, solo
`.next/standalone` + `.next/static` + `public/`. Corre como el usuario
`dds` (uid 1001), no como root.

### `Dockerfile.server`

```
build     → dotnet restore + dotnet publish -c Release
runtime   → imagen mcr.microsoft.com/dotnet/aspnet:10.0 (solo runtime, sin SDK)
```

La imagen de runtime instala `curl` (necesario para que el propio
healthcheck del contenedor pueda hacer `curl -f http://localhost:8080/health`
desde dentro) y luego crea un usuario `dds` sin privilegios para ejecutar
`dotnet server.dll`.

## `docker/database/`

### El principio: la app nunca se conecta como `sa`

Esto es una decisión de seguridad deliberada y consistente en todo el
proyecto (se repite igual en `infra/main.bicep` para Azure SQL): el login
`sa`/administrador del servidor **solo** se usa una vez, para crear un
login de aplicación de mínimo privilegio, y después nunca vuelve a usarse.
La cadena de conexión que recibe `server` (`ConnectionStrings__Default`)
usa siempre `APP_DB_USER`/`APP_DB_PASSWORD`, nunca `sa`.

### `init.sh`

1. Detecta qué versión de `sqlcmd` trae la imagen (18+ usa
   `/opt/mssql-tools18/` y necesita el flag `-C` para confiar en el
   certificado autofirmado del servidor; versiones anteriores usan
   `/opt/mssql-tools/` sin ese flag).
2. Espera en un bucle (hasta 60 intentos, 2s entre cada uno = 2 minutos)
   a que SQL Server acepte conexiones — el healthcheck de `sqlserver` ya
   garantiza esto en la práctica, pero el script es defensivo por si se
   ejecuta fuera de Compose.
3. Corre `init.sql` pasándole `AppDbName`, `AppLogin` y `AppPassword` como
   variables de scripting de `sqlcmd` (`-v`), nunca interpolados en el
   propio texto del script — así los valores vienen de `.env` en runtime,
   no están hardcodeados en `init.sql`.

### `init.sql`

Es idempotente: cada bloque comprueba primero si ya existe (la base de
datos, el login de servidor, el usuario dentro de la base, la membresía de
rol) antes de crearlo, así que se puede correr más de una vez sin error.

1. Crea la base de datos si no existe.
2. Crea el login a nivel de servidor si no existe.
3. Crea el usuario dentro de esa base específica, asociado a ese login.
4. Le da el rol `db_owner` — pero **solo dentro de esa base de datos**, no
   a nivel de servidor. Es el privilegio mínimo que la API necesita para
   poder correr las migraciones de Entity Framework Core y leer/escribir
   datos, sin llegar a `sysadmin`.

## Comandos útiles

En el día a día conviene usar los scripts de `scripts/` (ver la otra guía),
pero a veces es más directo hablar con Docker Compose sin intermediarios:

```bash
# Levantar todo en primer plano, reconstruyendo imágenes
docker compose -f docker/docker-compose.yml --env-file .env up --build

# Ver logs de un servicio específico
docker compose -f docker/docker-compose.yml logs -f server

# Reconstruir y reiniciar solo un servicio (sin tocar los demás)
docker compose -f docker/docker-compose.yml --env-file .env build client
docker compose -f docker/docker-compose.yml --env-file .env up -d client

# Ver el estado de los contenedores
docker compose -f docker/docker-compose.yml ps

# Ejecutar sqlcmd manualmente contra la base ya corriendo, como el usuario
# de la aplicación (nunca como sa, salvo para depurar algo puntual)
docker compose -f docker/docker-compose.yml exec sqlserver \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U dds_app -P '<APP_DB_PASSWORD>' -d DdsDb -C
```

## Problemas comunes

- **"address already in use" en el puerto 3000/8080/1433**: algo más en la
  máquina ya está usando ese puerto. Cambia `CLIENT_PORT`, `SERVER_PORT` o
  `DB_PORT` en `.env`, o libera el puerto que lo está usando.
- **`db-init` falla o queda reintentando**: casi siempre es
  `MSSQL_SA_PASSWORD` no cumpliendo la política de complejidad de SQL
  Server (mínimo 8 caracteres, mayúsculas, minúsculas, números y
  símbolos). `scripts/setup.sh` genera contraseñas que ya cumplen esto.
- **Cambié una contraseña en `.env` pero sigue sin funcionar**: si el
  volumen `mssql_data` ya existe de una corrida anterior, SQL Server sigue
  usando las credenciales con las que se inicializó ese volumen —
  `MSSQL_SA_PASSWORD` en `.env` no reconfigura una instancia ya
  inicializada. Hay que correr `scripts/clear.sh` para borrar el volumen y
  arrancar de cero (esto borra los datos).
- **El servidor no puede autenticarse con Azure (implementaciones)**: es
  esperado si `AZURE_SUBSCRIPTION_ID`/`AZURE_KEY_VAULT_NAME`/
  `AZURE_CONTAINER_APPS_ENV` están vacíos en `.env` — el resto de la app
  sigue funcionando igual, solo el deploy de una implementación queda en
  estado `error` con un mensaje claro.
