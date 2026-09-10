# Base44 Dev Environment

## What this app is
A pure static front-end (no build step): `index.html`, `app.js`, `styles.css`, plus a `CONSOLIDADO.csv` data file. It is a correspondence-management system ("Correspondencia | Mayola Gaona") written in Spanish.

## Backend
The app talks to **Supabase** directly from the browser. The Supabase project URL and publishable key are already hardcoded at the top of `app.js` — these are public/publishable values, not secrets. No server-side backend exists.

## Auth
Login is handled client-side: `app.js` queries the Supabase `usuarios` table for a matching `usuario` + `contraseña`, then stores the role in `localStorage`. No Base44-managed credentials are required.

## How it runs here
Served by `nginx:alpine` (see `docker-compose.base44.yml`) on host port 3000. The repo root is bind-mounted read-only into nginx's html dir, so edits to the static files are reflected on the next browser refresh — no rebuild or restart needed.

## Verify it works
- `docker compose -f docker-compose.base44.yml up -d`
- `curl -s http://localhost:3000/ | head` should return the `index.html` doctype.
- The preview should show the login screen.
