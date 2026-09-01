---
name: vypravy-ironknot
description: >-
  Builds and maintains the vypravy.ironknot.cz travel portal (npm workspaces,
  Vite/React trip apps, OSM/Leaflet maps, OSRM routes, TomTom traffic).
  Use when working on vypravy.ironknot.cz, n-s-26, s-b-sm-26, trip clones,
  itinerary maps, border crossings, EV chargers, hiking/GPX layers, or Vercel
  deploy of this portal. Not for TecmaApp or Tecma Cockpit.
---

# Výpravy ironknot

Portál **https://vypravy.ironknot.cz/** — každá cesta je složka `<slug>/` (Vite `base: '/<slug>/'`). Kořen webu je prázdný, bez rozcestníku. Detailní šablona: [vypravy-ironknot.md](../../../vypravy-ironknot.md) v kořeni git repozitáře (u osobní kopie skillu čti `vypravy-ironknot.md` v tomto projektu).

Referenční výpravy:

- `n-s-26/` — Norsko–Švédsko, **privátní** (`TRIP_PUBLIC = false`)
- `s-b-sm-26/` — Srbsko / Bulharsko / Severní Makedonie, **veřejná**

## Neměnit bez důvodu

- Nescrapovat dlaždice Mapy.cz. Turistická mapa = OSM + OpenTopoMap + Waymarked Trails.
- Neforce-pushovat `main` (lokální větev se může lišit od origin; produkce se nasazuje Vercel CLI).
- `TOMTOM_API_KEY` jen v env, ne do gitu.
- Sdílené API je v kořeni `api/` (`forecast`, `traffic`, `incidents` + `api/_tomtomIncidents.js`).

## Nová výprava

1. Zkopíruj `n-s-26/` (nebo bližší klon) na nový slug.
2. `tripMeta.ts`, `vite.config.ts` `base`, `main.tsx` `basename`, `package.json` name, `index.html`, `scripts/catalog.mjs`, `vercel.json` rewrite, kořenový workspace.
3. Data v `src/data/` + `scripts/build-routes.mjs` (`PLACES`, `SEGMENTS`, `DAY_SEGMENTS`).
4. `npm run build:routes` a fetch skripty níže.

**Privátní:** nové `SALT` / `STORAGE_KEY` a hashe v `auth.ts`. **Veřejná:** `TRIP_PUBLIC = true`.

## Data a skripty (`<slug>/`)

| Soubor / příkaz | Účel |
| --- | --- |
| `itinerary.json` | dny, `navPlaceId` když navigace ≠ vrchol (lanovka) |
| `places.json` / `routes.json` | `npm run build:routes` (OSRM) |
| `corridor-pois.json` | `npm run fetch:pois` — fuel 20 km, hospital/vet 50 km |
| `ev-chargers.json` | `npm run fetch:chargers` — DC / Tesla ≤25 km (s-b-sm-26) |
| `border-crossings.json` | `npm run fetch:borders` — ZOLL, stejný úsek hranice, zajížďka ≤90 min |
| `hike-*.json` | `npm run fetch:hike` + `fetch:hike-elevation` |

Overpass: preferuj `https://overpass.openstreetmap.fr/api/interpreter`.

## Mapa — povinné chování

- Koridorové vrstvy **benzínky, nabíjení, nemocnice, veterina, přechody (ZOLL)** jsou na mapě **defaultně vypnuté**. Zapínají se tlačítky u radar ovládání (`MapPoiLayerToggles`). Stejně v n-s-26 i s-b-sm-26.
- Trek (den bez silnice): OpenTopoMap + Waymarked Trails, OSM GPX trasa, tlačítko GPS (`watch` + high accuracy; nepanovat, pokud je uživatel >20 km od treku).
- Výškový profil vedle treku (graf + start/cíl/POI). Data z Open-Meteo elevation, konce zarovnat na OSM `ele`.
- GPX ke stažení do Mapy.cz / OsmAnd. Odkaz na Mapy.cz turistickou vrstvu je v pořádku; jejich tiles nestahovat.
- Radar max zoom 7, pak se sám vypne. Hiking den zoom ~14.
- Navigace: Google Maps, Waze, Apple Maps, `geo:`.

## UI

- Hlavička: plný název výpravy, `whitespace-nowrap` / `shrink-0` — netruncovat.
- Mobil: záložky Itinerář / Mapa / Detail dne.
- Zámek celé trasy vs. zoom na den (Europe/Prague).

## Build / Vercel

Kořen repa, `npm run build` (workspaces + `scripts/assemble-dist.mjs`). Root Directory = git root, Output `dist`, env `TOMTOM_API_KEY`. Doména `vypravy.ironknot.cz`.
