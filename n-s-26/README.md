# Norsko-Švédsko 2026

Interaktivní cestovní plán **Hradec Králové → Norsko & Švédsko → Hradec Králové**.

Privátní aplikace na [vypravy.ironknot.cz/n-s-26](https://vypravy.ironknot.cz/n-s-26) (heslo).

Jak založit další cestu a co umí šablona: viz [`vypravy-ironknot.md`](../vypravy-ironknot.md) v kořeni portálu.

## Lokální vývoj

Z kořene portálu:

```bash
npm install
npm run dev:n-s-26
```

Nebo přímo ve složce `n-s-26/`:

```bash
npm install
npm run dev
```

Aplikace běží na [http://localhost:5173/n-s-26/](http://localhost:5173/n-s-26/).

## Data

- Itinerář: `moje/Norsko-Svedsko 26.xlsx` → `src/data/itinerary.json`
- Trasy: `npm run build:routes` → `src/data/routes.json` + `src/data/places.json`
- POI podél trasy: `npm run fetch:pois` → `src/data/corridor-pois.json`

## Live provoz (TomTom)

1. [developer.tomtom.com](https://developer.tomtom.com/) → API Keys
2. Lokálně: `.env.local` s `TOMTOM_API_KEY=...`
3. Vercel: stejná proměnná v Environment Variables

Bez klíče se zobrazí odhad km a času při max 110 km/h.
