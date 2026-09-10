# Base44 Dev Environment

## What this app is
A pure static front-end (no build step): `index.html`, `app.js`, `styles.css`, plus a `CONSOLIDADO.csv` data file. It is a correspondence-management system ("Correspondencia | Mayola Gaona") written in Spanish.

## Architecture (local)
The app runs entirely locally in the sandbox — no external Supabase needed:

- **`db`** — PostgreSQL 15 (`postgres:15-alpine`). Database name: `correspondencia`. Schema in `db/init.sql` (all date/time columns are `text` because the data uses D/M/YYYY format).
- **`api`** — Node.js Express server (`api/server.js`) that provides a PostgREST-compatible REST API + Supabase Storage-compatible file upload/download. Runs on port 3001 inside the container.
- **`web`** — nginx serving static files on port 3000, proxying `/rest/v1/` and `/storage/v1/` to the api server.

The app (`app.js`) uses `window.location.origin` as the Supabase URL, so all API calls go through nginx on port 3000, which routes them to the local API server.

## Data
Data was migrated from the original remote Supabase project. The migration script fetches all rows from each table via the Supabase REST API and inserts them into the local PostgreSQL. To re-run: see the migration approach in `/tmp/migrate.js` (fetches from `https://ehsbhaepkknxdpvcttaz.supabase.co`).

## Auth
Login is handled client-side: `app.js` queries the local `usuarios` table for a matching `usuario` + `contrasena`, then stores the role in `localStorage`. Users: `fcorascon`/`xmiswebs` (admin), `comisionpa`/`congreso2427`, `MaritzaEstrada`/`Congres01`, `Correspondencia`/`Mayo14`.

## Quirks
- The `db/init.sql` file may get overwritten by a previous session's version (with `date` types and embedded data). If the database fails to start with "date/time field value out of range", the init.sql needs to be replaced with the `text`-column version.
- The API healthcheck must use `127.0.0.1` (not `localhost`) because Node.js binds to IPv4 only and `localhost` may resolve to IPv6 `::1`.
- The `anon` role in PostgreSQL is created by init.sql but the API server connects as `postgres` (superuser), so it's not strictly needed.

## Verify it works
- `docker compose -f docker-compose.base44.yml up -d`
- `curl -s http://localhost:3000/rest/v1/usuarios?select=*` should return user records.
- The preview should show the login screen; log in with `fcorascon`/`xmiswebs`.
