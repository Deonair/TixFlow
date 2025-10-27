# TixFlow – Lokale setup (zonder Docker)

Dit project draait lokaal met een Express/Mongoose backend en een React/Vite frontend.

## Vereisten
- Node.js 18+ en npm
- MongoDB lokaal (standaard poort `27017`), of een Atlas-URL

## Configuratie
Backend omgevingsvariabelen staan in `my-app/backend/.env`:
```
DB_HOST=localhost
DB_PORT=27017
DB_NAME=tixflow
MONGO_URI=mongodb://localhost:27017/tixflow
PORT=5050
```
- Gebruik eventueel een andere `MONGO_URI` (bijv. Atlas) als je geen lokale Mongo wilt.
- De backend gebruikt `MONGO_URI ?? 'mongodb://localhost:27017/tixflow'` als fallback.

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
- Connect: `mongodb://localhost:27017/`
- Database: `tixflow`
- Collectie: `events`

## Zonder Docker
Alle Dockerbestanden zijn verwijderd (compose, Dockerfiles, .dockerignore). Ontwikkeling en testen verlopen nu lokaal met npm-scripts.