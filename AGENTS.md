# Base44 Dev Environment

## What this app is
A pure static front-end (no build step): `index.html`, `app.js`, `styles.css`, plus a `CONSOLIDADO.csv` data file. It is a correspondence-management system ("Correspondencia | Mayola Gaona") written in Spanish.

## Architecture (local)
The app runs entirely locally with three Docker services:

1. **`db`** — PostgreSQL 15 (`postgres:15-alpine`) with all 9 tables and 672 records pre-loaded from the original Supabase project. Init script at `db/init.sql` runs on first boot only (stored in the `db_data` volume).
2. **`api`** — Node/Express server (`node:22-alpine`, code in `api/server.js`) that implements a PostgREST-compatible REST API + a Supabase Storage-compatible file upload/serve API. Connects to PostgreSQL and listens on port 3001.
3. **`web`** — nginx (`nginx:alpine`) serving the static files on port 3000 and proxying `/rest/v1/` and `/storage/v1/` to the API server.

`app.js` uses `window.location.origin` as the Supabase URL, so all API calls go through nginx to the local server.

## Tables (9)
`usuarios` (4), `autorizados` (7), `status` (2), `tipo` (2), `recibida` (283), `despachada` (118), `iniciativas` (84), `proposiciones` (81), `fisca` (91).

All columns are `text` except `id` (bigint) and `rol`/`no` (integer) — this preserves the original data formats (dates stored as `DD/M/YYYY` strings, etc.).

## Auth
Login is handled client-side: `app.js` queries the `usuarios` table for matching `usuario` + `contrasena`, then stores the role in `localStorage`. Default users: `fcorascon`/`xmiswebs` (admin, rol=1), `comisionpa`/`congreso2427`, `MaritzaEstrada`/`Congres01`, `Correspondencia`/`Mayo14`.

## File uploads
Uploaded via the Storage API to a local `/uploads` Docker volume. The Express server handles `POST /object/attachments/*` (multipart) and `GET /object/public/attachments/*` (serve file).

## How to run
```
docker compose -f docker-compose.base44.yml up -d
```

## Verify it works
- `curl http://localhost:3000/` → HTML
- `curl http://localhost:3000/rest/v1/usuarios?select=*` → JSON array of users
- Login in the preview with `fcorascon` / `xmiswebs`

## Resetting the database
To re-run the init script (e.g. after changing `db/init.sql`):
```
docker compose -f docker-compose.base44.yml down -v
docker compose -f docker-compose.base44.yml up -d
```
