# Norsko-Švédsko 2026

Interaktivní cestovní plán road tripu **Hradec Králové → Norsko & Švédsko → Hradec Králové**.

## Funkce

- Denní itinerář se programem a tipy na místa
- Mapa trasy po silnicích (OSRM / OpenStreetMap)
- Trajekt Rostock–Trelleborg vyznačen přerušovanou čárou
- Odkazy na Wikipedia a turistické stránky, náhledové fotografie se zdrojem

## Lokální vývoj

```bash
npm install
npm run data          # import Excelu + výpočet tras
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Data

- Itinerář: `moje/Norsko-Svedsko 26.xlsx` → `src/data/itinerary.json`
- Trasy: `scripts/build-routes.mjs` → `src/data/routes.json`

## Nasazení

Aplikace běží na [n-s-26.ironknot.cz](https://n-s-26.ironknot.cz) (Vercel).

## Live provoz (TomTom)

Mapy Google/Waze neposkytují live data zdarma bez vlastního API klíče. Používáme **TomTom Routing** (freemium, bez karty).

1. Registrace: [developer.tomtom.com](https://developer.tomtom.com/)
2. Dashboard → **API Keys** → zkopíruj klíč (např. „My first API key“)
3. Lokálně: `cp .env.example .env.local` a doplň `TOMTOM_API_KEY=...`, pak `npm run dev`
4. Produkce (Vercel): Project → Settings → Environment Variables → `TOMTOM_API_KEY` → Redeploy

Bez klíče se zobrazí odhad km a času z OSRM (limity silnic); fallback jen při chybějící době v datech je max 110 km/h.
