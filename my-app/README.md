# TixFlow Frontend — React + Vite

Dit is de frontend van TixFlow. De backend staat in `my-app/backend`.

## Snel starten
```
npm install
npm run dev
```
Frontend draait op `http://localhost:5173`. Zorg dat de backend op `http://localhost:5050` draait.

## API proxy
- Proxy: `/api` → `VITE_API_URL` (default `http://localhost:5050`), ingesteld in `vite.config.ts`.
- Als je backend elders draait, zet `VITE_API_URL` in je omgeving.

## Nuttige scripts
- `npm run dev` — start de frontend
- `npm run build` — productie build
- `npm run preview` — preview van de build
- `npm run dev:all` — start backend + frontend (uit root `my-app`)
- `npm run dev:all:stripe` — alles + Stripe webhook listener (vereist Stripe CLI)

## Auth en cookies
Frontend gebruikt `credentials: include` bij requests zoals `/api/users/me`. Controleer dat backend CORS `APP_BASE_URL` overeenkomt met je frontend‑URL.

## Meer details
Zie de root `README.md` voor een volledig overzicht (env, routes, testmethoden en tips).

## Superadmin toegang

Benodigdheden
- Stel je backend‑omgeving in `my-app/backend/.env` in:
```
SUPERADMIN_EMAIL=jeemail@example.com
SUPERADMIN_PASSWORD=sterkwachtwoord
# of whitelist alternatief (comma‑separated)
SUPERADMIN_EMAILS=admin1@example.com,admin2@example.com
# optioneel: whitelist per ID (Mongo ObjectId, comma‑separated)
SUPERADMIN_IDS=
# Moet overeenkomen met je frontend dev‑URL (poort kan 5173 of 5174 zijn)
APP_BASE_URL=http://localhost:5174
```

Stappen
- Start beide dev‑servers vanuit `my-app`: `npm run dev:all`.
- Open de frontend: `http://localhost:5173/` (of `http://localhost:5174/` als 5173 bezet is).
- Ga naar `http://localhost:5173/superadmin` (of `http://localhost:5174/superadmin`).
- Log in met `SUPERADMIN_EMAIL` en `SUPERADMIN_PASSWORD` (of gebruik een e‑mail uit `SUPERADMIN_EMAILS`).
- Na succesvol inloggen zie je het overzicht van organisatoren en statistieken.

Troubleshooting
- “Niet ingelogd als superadmin”: controleer dat `APP_BASE_URL` exact gelijk is aan je frontend‑URL en poort.
- Herstart de backend na `.env`‑wijzigingen: `npm --prefix backend run dev`.
- Sessiestatus verifiëren: `GET /api/admin/me` moet je superadmin‑sessie teruggeven.

Opmerkingen
- Commit nooit je `.env`; gebruik `my-app/backend/.env.example` als referentie.
- In productie zet je `APP_BASE_URL` op je echte domein en zorg je voor HTTPS.
- `SUPERADMIN_EMAILS` en `SUPERADMIN_IDS` zijn optioneel; laat ze leeg om whitelisting uit te zetten. Ze worden niet automatisch door de server ingevuld.
