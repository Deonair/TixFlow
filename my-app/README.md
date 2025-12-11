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
