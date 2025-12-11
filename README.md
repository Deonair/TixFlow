# TixFlow — Overzicht en lokale ontwikkeling

TixFlow is een eenvoudige ticketing-app: events aanmaken, tickets verkopen (Stripe), tickets e‑mailen als PDF met QR, en check‑in/validatie via het dashboard.

## Features
- Events beheren (aanmaken, bewerken, status)
- Betalen via Stripe Checkout (testmodus)
- Tickets genereren met unieke token en QR
- Tickets e‑mailen via Resend (of lokaal previewen)
- Check‑in: verifiëren en inwisselen van tickets
- Organisatoraccounts met sessies en instellingen

## Architectuur
- Frontend: `React + Vite` in `my-app/`
- Backend: `Express + Mongoose` in `my-app/backend/`
- Database: `MongoDB` (lokaal of Atlas)
- Sessies: `express-session` met `connect-mongo`

## Snel starten
In de root heb je twee opties:

1) Backend en frontend apart starten
```
cd my-app/backend && npm install && npm run dev
cd ../ && npm install && npm run dev
```
- Backend: `http://localhost:5050`
- Frontend: `http://localhost:5173`

2) Alles tegelijk (concurrently)
```
cd my-app
npm install
npm run dev:all
```
Optioneel met Stripe webhook listener:
```
npm run dev:all:stripe
```
(vereist de Stripe CLI en een geldige `STRIPE_WEBHOOK_SECRET`)

## Omgevingsvariabelen (backend)
Maak `my-app/backend/.env` aan. Zie ook `my-app/backend/.env.example`.

- `PORT` — poort van de API (default `5050`)
- `NODE_ENV` — `development` of `production`
- `MONGO_URI` — Mongo connectiestring (lokaal of Atlas)
- `SESSION_SECRET` — sessiegeheim voor cookies
- `COOKIE_SAMESITE` — `lax | strict | none` (cookies policy)
- `COOKIE_SECURE` — `true | false | auto` (secure cookies)
- `APP_BASE_URL` — basis‑URL van de app (bijv. `http://localhost:5173` of productie‑domein)
- `RESEND_API_KEY` — API key voor Resend (e‑mail)
- `EMAIL_FROM` — afzender, bijv. `tickets@send.tixflow.nl`
- `STRIPE_SECRET_KEY` — Stripe secret (testmodus)
- `STRIPE_WEBHOOK_SECRET` — Webhook secret uit Stripe CLI/dashboard
- Dev‑fallbacks:
  - `USE_IN_MEMORY_MONGO` — forceer in‑memory in dev
  - `DEV_IN_MEMORY_FALLBACK` — val terug op in‑memory bij connectiefout (dev)
  - `PROD_IN_MEMORY_FALLBACK` — alleen in nood in productie (af te raden)

Frontend proxy: `my-app/vite.config.ts`
- Proxy route: `/api` → `VITE_API_URL` (default `http://localhost:5050`)
- Stel optioneel `VITE_API_URL` in je frontend env om naar een andere backend te wijzen

## Belangrijke routes
- Frontend
  - `GET /event/:slug` — publieke eventpagina
  - `GET /checkout/success` — succespagina na Stripe; URL wordt opgeschoond (geen `session_id` zichtbaar)
  - `GET /admin` — dashboard voor organisators

- Backend
  - `POST /api/events` — event aanmaken (auth vereist)
  - `GET /api/events` — eigen events (auth)
  - `GET /api/events/slug/:slug` — publiek event
  - `POST /api/users/register` — organisator registreren
  - `POST /api/users/login` — inloggen (zet sessiecookie)
  - `GET /api/users/me` — huidige gebruiker
  - `PATCH /api/users/me` — gegevens bijwerken (auth)
  - `POST /api/payments/checkout-session` — Stripe sessie aanmaken
  - `GET /api/payments/confirm/:sessionId` — fallback bevestiging en ticketverwerking
  - `POST /api/webhook/stripe` — Stripe webhook (raw body)
  - `GET /api/tickets/verify?token=...` — ticket verifiëren
  - `POST /api/tickets/redeem` — ticket inwisselen
  - `GET /api/preview/email` — e‑mailvoorbeeld (HTML) voor snelle check
  - `GET /api/preview/pdf` — voorbeeld‑PDF downloaden/bekijken
  - `GET /api/health` — healthcheck

## Testmethoden
- Payments (Stripe test)
  - Start met `npm run dev:all:stripe` in `my-app`.
  - Plaats een bestelling op een event. Gebruik testkaart `4242 4242 4242 4242`.
  - Na terugkeer naar `checkout/success` wordt de URL opgeschoond; backend bevestigt via webhook. Zo nodig kun je de fallback aanroepen: `GET /api/payments/confirm/:sessionId`.
  - Controleer dat er tickets en een order zijn aangemaakt en dat de e‑mail verstuurd/gelogd is.

- Tickets verifiëren/inwisselen
  - Via dashboard: open Check‑in, voer de ticketcode in, verifieer en klik "Check‑in".
  - Via API: `GET /api/tickets/verify?token=CODE` en `POST /api/tickets/redeem` met body `{ token: "CODE" }`.

- E‑mail en PDF layout
  - `GET /api/preview/email` om de HTML van de bevestigingsmail te bekijken.
  - `GET /api/preview/pdf` om de ticket‑PDF inline te bekijken (QR + details).
  - Handig als `RESEND_API_KEY` (verzenden) nog niet is geconfigureerd.

- Organizer authenticatie
  - Registreer via `/api/users/register`, log in via `/api/users/login`.
  - Frontend gebruikt `credentials: include` bij `/api/users/me`; zorg dat backend CORS `APP_BASE_URL` klopt.

## Veelvoorkomende issues
- `401` op `/api/users/me`: backend niet gestart, sessie niet gezet, of `APP_BASE_URL` wijst niet naar frontend; controleer CORS en cookies.
- Mongo connectie faalt in dev: zet `DEV_IN_MEMORY_FALLBACK=true` of start lokale `mongod`.
- Stripe webhook faalt: check `STRIPE_WEBHOOK_SECRET` en dat de endpoint raw body gebruikt.

## Productie tips
- Zet `NODE_ENV=production`, gebruik echte `MONGO_URI` en een sterke `SESSION_SECRET`.
- Configureer `COOKIE_SAMESITE=none` en `COOKIE_SECURE=true` bij gebruik van een apart frontend‑domein.
- Stel `APP_BASE_URL` correct in voor succes‑ en annuleer‑URL’s en ticketlinks.

## Nuttige scripts (frontend `my-app/package.json`)
- `npm run dev` — alleen frontend
- `npm run dev:all` — backend + frontend
- `npm run dev:stripe` — Stripe webhook listener
- `npm run dev:all:stripe` — alles + webhook listener

Deze README is opgeschoond en gericht op wat je daadwerkelijk nodig hebt om te draaien, te testen en te begrijpen hoe de app werkt.
