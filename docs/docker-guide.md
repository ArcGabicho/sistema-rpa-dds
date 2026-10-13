# Guía de Docker

Documenta todo lo que vive bajo `docker/`: los dos servicios del stack local
(`docker-compose.yml`) y sus Dockerfiles (`Dockerfile.client`,
`Dockerfile.server`). Para los scripts que envuelven estos comandos
(`scripts/run.sh`, `scripts/clear.sh`, etc.), ver
[bash-scripts-guide.md](./bash-scripts-guide.md).

## Visión general

```
docker/
├── Dockerfile.client      # build de core/client (Next.js)
├── Dockerfile.server      # build de core/server (ASP.NET Core)
└── docker-compose.yml     # orquesta los 2 servicios en local
```

`docker-compose.yml` levanta dos servicios:

```
server ──► client
(healthy)
```

- **`server`**: la API de ASP.NET Core.
- **`client`**: el sitio Next.js, que es el único punto de entrada para el
  usuario final (habla con `server` internamente, dentro de la red `dds`).

**No hay base de datos en Docker.** La API se conecta siempre a la base de
Azure SQL Database indicada en `DB_CONNECTION_STRING`, tanto en local como en
producción.

Los dos servicios comparten una red interna (`dds`) y las credenciales se
inyectan como variables de entorno leídas desde `.env` (ver
[`.env.example`](../.env.example) para la lista completa con comentarios).
Ninguna contraseña ni secreto está escrito en el `docker-compose.yml` ni en
ningún Dockerfile: todos vienen de `${VARIABLE}` resuelta contra `.env`.

## Dónde corre cada pieza en producción

| Pieza | Plataforma | Cómo se construye |
|---|---|---|
| API (`core/server`) | Dokploy (VM Ubuntu) | `docker/Dockerfile.server`, contexto de build en la raíz del repo |
| Sitio (`core/client`) | Vercel | Vercel compila `core/client` directamente (no usa `Dockerfile.client`) |
| Base de datos | Azure SQL Database | Se crea desde el portal de Azure, fuera de este repo |

El `docker-compose.yml` solo existe para correr los dos servicios juntos en
local; Dokploy y Vercel no lo usan.

## Los servicios

### `server`

Se construye desde `docker/Dockerfile.server` con contexto de build la raíz
del repo (`context: ..`).

Variables de entorno relevantes (todas mapeadas 1:1 a `appsettings.json`
vía la convención `Seccion__Clave` de ASP.NET Core):

| Variable | Sección en appsettings | Notas |
|---|---|---|
| `ConnectionStrings__Default` | `ConnectionStrings:Default` | Viene de `DB_CONNECTION_STRING` en `.env`. Debe usar un usuario propio de la aplicación, no el administrador del servidor SQL. |
| `Jwt__Secret`, `Jwt__ExpiresInMinutes` | `Jwt:*` | Firma de los JWT de sesión. |
| `Admin__Email`, `Admin__Password`, `Admin__FullName` | `Admin:*` | Usuario administrador sembrado en el primer arranque si no existe ninguno (`AdminSeeder.cs`). |
| `Cors__AllowedOrigins__0` | `Cors:AllowedOrigins` | Origen desde el que el cliente puede llamar a la API. |

El healthcheck pega a `GET /health` (mapeado en `Program.cs`) cada 10s, con
un `start_period` de 60s: al arrancar, la API aplica las migraciones de EF
Core contra Azure SQL, y una base serverless que estaba en pausa automática
puede tardar hasta un minuto en reanudarse. `client` no arranca hasta que
este healthcheck pase.

`/health` no consulta la base de datos a propósito: si lo hiciera, el
healthcheck mantendría despierta la base todo el tiempo y agotaría el cupo
gratuito de Azure SQL en pocos días.

### `client`

Se construye desde `docker/Dockerfile.client`, también con contexto en la
raíz del repo. Solo necesita `API_URL` (apuntando al servicio `server` por
su nombre de red interna, `http://server:8080`, no `localhost`, ya que
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
dependencias de producción realmente usadas, así que la imagen final no
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
`dotnet server.dll`. Es la misma imagen que construye Dokploy en producción.

## Comandos útiles

En el día a día conviene usar los scripts de `scripts/` (ver la otra guía),
pero a veces es más directo hablar con Docker Compose sin intermediarios:

```bash
# Levantar todo en primer plano, reconstruyendo imágenes
docker compose -f docker/docker-compose.yml --env-file .env up --build

# Ver logs de un servicio específico
docker compose -f docker/docker-compose.yml logs -f server

# Reconstruir y reiniciar solo un servicio (sin tocar el otro)
docker compose -f docker/docker-compose.yml --env-file .env build client
docker compose -f docker/docker-compose.yml --env-file .env up -d client

# Ver el estado de los contenedores
docker compose -f docker/docker-compose.yml ps
```

## Problemas comunes

- **"address already in use" en el puerto 3000/8080**: algo más en la
  máquina ya está usando ese puerto. Cambia `CLIENT_PORT` o `SERVER_PORT`
  en `.env`, o libera el puerto que lo está usando.
- **`server` no pasa el healthcheck y se reinicia**: casi siempre es la
  conexión a Azure SQL. Revisa que `DB_CONNECTION_STRING` sea correcta y que
  el firewall del servidor SQL en Azure permita la IP pública desde la que
  te conectas (tu máquina en local, la VM de Dokploy en producción).
- **El primer request tarda cerca de un minuto**: es la base serverless
  reanudándose de la pausa automática. Es esperado; los siguientes requests
  son normales.
- **La contraseña de la base tiene `$` o `#` y la conexión falla**: pon
  `DB_CONNECTION_STRING` entre comillas simples en `.env`, para que Docker
  Compose la lea literal.
