# TixFlow – Lokale setup (zonder Docker)

Dit project draait lokaal met een Express/Mongoose backend en een React/Vite frontend.

## Vereisten
- Node.js 18+ en npm
- MongoDB lokaal (standaard poort `27017`), of een Atlas-URL

## Configuratie
Backend omgevingsvariabelen staan in `my-app/backend/.env`:
```
PORT=5050
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/tixflow

# Fallback beleid (dev-only)
USE_IN_MEMORY_MONGO=false
DEV_IN_MEMORY_FALLBACK=false
# Productie noodgeval (meestal NIET gebruiken)
PROD_IN_MEMORY_FALLBACK=false
```
- In development kan je lokaal Mongo draaien (`127.0.0.1:27017`) of een Atlas URI gebruiken.
- In productie wordt niet stilletjes naar in‑memory gevallen. Bij mislukte connectie zonder expliciete fallback stopt de app.
- Zet in productie: `NODE_ENV=production` en een echte `MONGO_URI` (Atlas of managed instance).

Frontend proxy naar backend staat in `my-app/vite.config.ts`:
- Proxy: `/api` -> `http://localhost:5050` (fallback)
- `VITE_API_URL` kan optioneel een andere backend-URL aanwijzen.

## Installatie
Voer deze stappen uit in twee terminals:

1) Backend
```
cd my-app/backend
npm install
npm run dev
```
Backend luistert op `http://localhost:5050`.

2) Frontend
```
cd my-app
npm install
npm run dev
```
Frontend draait op `http://localhost:5173`.

## Snel testen
- Health: `curl http://localhost:5050/api/health` → `{ ok: true, db: 'connected' }`
- Alle events: `curl http://localhost:5050/api/events`
- Event aanmaken:
```
curl -X POST http://localhost:5050/api/events \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test Event",
    "date": "2025-01-01T12:00:00.000Z",
    "location": "Amsterdam",
    "description": "Demo"
  }'
```

## Data bekijken in MongoDB Compass
- Connect: `mongodb://127.0.0.1:27017/`
- Database: `tixflow`
- Collectie: `events`

## Fallback beleid samengevat
- Development:
  - Forceer in‑memory met `USE_IN_MEMORY_MONGO=true`.
  - Val naar in‑memory bij connectiefout met `DEV_IN_MEMORY_FALLBACK=true`.
- Productie:
  - Vereist een echte `MONGO_URI`.
  - Geen fallback, tenzij bewust `PROD_IN_MEMORY_FALLBACK=true` (ontraden).

## Zonder Docker
Alle Dockerbestanden zijn verwijderd (compose, Dockerfiles, .dockerignore). Ontwikkeling en testen verlopen nu lokaal met npm-scripts.
