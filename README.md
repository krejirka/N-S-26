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
