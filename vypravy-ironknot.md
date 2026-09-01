# Šablona výpravy (vypravy.ironknot.cz)

Tento dokument popisuje, jak je postavený portál **výprav** a jak z existující aplikace udělat **ekvivalentní novou cestu**. Referenční implementace je privátní výprava **Norsko-Švédsko 2026** ve složce `n-s-26/`. Veřejný klon je `s-b-sm-26/`.

Adresa každé výpravy je vždy:

```
https://vypravy.ironknot.cz/<slug>/
```

`<slug>` = název složky aplikace (např. `n-s-26`, `s-b-sm-26`). Další cesty přibývají jako další složky vedle sebe, ne jako další routy uvnitř jedné SPA.

---

## 1. Architektura portálu

```
vypravy.ironknot.cz/          ← git root, Vercel root, název projektu
  package.json                ← npm workspaces + build obou (všech) aplikací
  vercel.json                 ← redirect staré domény + SPA rewrite na /<slug>/
  api/                        ← sdílené serverless funkce (počasí, provoz, stavby)
    forecast.js
    traffic.js
    incidents.js
  scripts/
    catalog.mjs               ← seznam výprav (složky, které se zabalí do dist)
    assemble-dist.mjs         ← složí dist/<slug>/ + prázdný dist/index.html
  n-s-26/                     ← kompletní Vite/React aplikace
  s-b-sm-26/                  ← další kompletní Vite/React aplikace
  vypravy-ironknot.md         ← tento soubor
```

Každá složka výpravy je samostatná aplikace: vlastní `src/`, `src/data/`, `vite.config.ts` (`base: '/<slug>/'`), `package.json`, skripty na trasy.

Sdílené na úrovni portálu:

- **API** na `https://vypravy.ironknot.cz/api/...` (klient volá `/api/forecast` z originu, ne z base path).
- **TomTom klíč** (`TOMTOM_API_KEY`) v `.env.local` u výpravy a ve Vercel Environment Variables.
- **Kořen** `https://vypravy.ironknot.cz/` je prázdný (bez rozcestníku). Adresy výprav se nesdílejí z úvodní stránky.

Původní adresa `https://n-s-26.ironknot.cz` se přesměruje na `https://vypravy.ironknot.cz/n-s-26` (`vercel.json` → `redirects` podle hostitele).

---

## 2. Jak založit novou výpravu

1. Zkopíruj složku `n-s-26/` na nový slug, např. `s-b-sm-26/`.
2. V nové složce uprav:
   - `src/tripMeta.ts` — slug, titulek, `TRIP_PUBLIC`, geografické `MAP_MAX_BOUNDS`
   - `vite.config.ts` — `base: '/<slug>/'` a `server.open`
   - `src/main.tsx` — `basename="/<slug>"`
   - `package.json` — `"name": "<slug>"`
   - `index.html` — `<title>` a description
3. Přidej záznam do `scripts/catalog.mjs`.
4. Do kořenového `package.json` doplň workspace (už je `n-s-26` a `s-b-sm-26`).
5. Do `vercel.json` doplň rewrite `/<slug>` a `/<slug>/:path*` → `/<slug>/index.html`.
6. Nahraď data v `src/data/` (níže) a přegeneruj trasy.

**Privátní cesta:** `TRIP_PUBLIC = false` — zůstane přihlášení heslem (`src/lib/auth.ts`).  
**Veřejná cesta:** `TRIP_PUBLIC = true` — LoginGate se přeskočí, data včetně dat jsou vidět.

Hesla se v bundlu neukládají v plaintextu, jen salted SHA-256. Pro novou *privátní* výpravu změň `SALT` a `STORAGE_KEY` v `src/lib/auth.ts` a spočítej nové hashe. Pro veřejnou výpravu soubor `auth.ts` může zůstat, nepoužije se.

---

## 3. Data výpravy (`src/data/`)

| Soubor | Účel |
| --- | --- |
| `itinerary.json` | Dny, program, logistika, karty míst (text, fotky, odkazy) |
| `places.json` | Souřadnice všech bodů + `daySegments` (které úseky patří kterému dni) |
| `routes.json` | Geometrie silnic z OSRM (a případně trajektů) |
| `lodgings.json` | Ubytování — dům na mapě, adresa, navigace |
| `corridor-pois.json` | Benzínky / nemocnice / veterina podél trasy (Overpass). Na mapě defaultně skryté. |
| `ev-chargers.json` | Volitelné DC / Tesla nabíječky (s-b-sm-26). Na mapě defaultně skryté. |
| `border-crossings.json` | Alternativní hraniční přechody (stejný úsek, zajížďka ≤90 min) |
| `hike-*.json` | Pěší trasa + výškový profil (OSM + Open-Meteo). Jen dny bez silnice. |
| `shops.json` | Volitelné obchody podél koridoru (např. IKEA). Není povinné. |
| `fishing-spots.json` | Volitelná rybářská místa. Není povinné. |

`places.json` a `routes.json` se **negnerují ručně** — vznikají skriptem `npm run build:routes` z `scripts/build-routes.mjs`.

### 3.1 `itinerary.json`

```json
{
  "meta": {
    "title": "Název na stránce",
    "origin": "Hradec Králové",
    "destination": "Hradec Králové",
    "highlights": ["místo 1", "místo 2"],
    "totalDays": 6,
    "totalKmExcel": 0,
    "note": "Silniční trasy vypočteny z OpenStreetMap přes OSRM."
  },
  "days": [ ]
}
```

Každý den:

| Pole | Význam |
| --- | --- |
| `day` | Pořadí 1…n |
| `date` | `YYYY-MM-DD` (u privátní výpravy lze skrýt druhým heslem) |
| `weekday` | česky, malé písmeno |
| `destination` | Titulek dne v hlavičce a v seznamu |
| `km` | Záložní km, pokud den nemá silniční segmenty |
| `lodging` | Text v pill (název hotelu / „bez noclehu“) |
| `logistics` | Krátký řádek (časy, hranice, cena) |
| `program` | Delší popis dne |
| `placeId` | Klíč v `places.json` — cíl dne, počasí, výchozí zoom |
| `navPlaceId` | Volitelně: kam navigovat autem, pokud se liší od `placeId` (lanovka místo vrcholu) |
| `phase` | `"tam"` oranžová trasa, `"zpět"` tyrkysová |
| `places[]` | Karty v detailu dne |

Karta místa (`places[]`):

- `name`, `tips[]`, `links[{label,url}]`, `image[{url,alt,source,sourceUrl}]`
- `placeId` — pokud existuje stejný klíč v `places.json`, karta dostane tlačítko **Navigovat** (Google Maps, Waze, Apple Maps, systémové `geo:`)

Fotky: Wikimedia Commons přes `https://commons.wikimedia.org/wiki/Special:FilePath/<soubor>?width=640`. Špatný soubor se na kartě skryje (`onError`).

### 3.2 Body v `scripts/build-routes.mjs`

Objekt `PLACES`: každý bod má `name`, `lat`, `lng`, `country` (česky — z něj se bere **vlaječka**), volitelně `address`, `dayLabel`, `markerKind: "ferry"`.

Pole `SEGMENTS`: silniční úseky `from` / `to` (klíče z `PLACES`), `kind: "road" | "ferry"`, `phase`, `dayLabel`. Volitelně `via: [{lat,lng}, …]` pro vynucení trasy (hranice, obchvat).

`DAY_SEGMENTS`: mapa čísla dne → pole id segmentů. Prázdné pole = stání na místě (výlet pěšky / lanovka).

Potom:

```bash
cd <slug>
npm run build:routes    # OSRM, ~1,2 s pauza mezi úseky
npm run fetch:pois      # Overpass: fuel 20 km, hospital/vet 50 km
npm run fetch:borders   # alternativní ZOLL přechody
# volitelně u EV výpravy:
npm run fetch:chargers
npm run fetch:fuel      # benzínky, pokud fetch:pois fuel vynechal
# volitelně pěší den:
npm run fetch:hike      # OSM trasa + výškový profil
```

OSRM: `https://router.project-osrm.org/route/v1/driving/{lng,lat;…}?overview=full&geometries=geojson`.

Ubytování zadej se **přesnou adresou** a souřadnicemi (Nominatim / mapy). Stejný `placeId` dej do `lodgings.json` — na mapě se místo vlaječky ukáže dům.

---

## 4. Funkce, které se kopírují s aplikací

### Mapa a trasa

- OpenStreetMap dlaždice, Leaflet. U pěšího dne: OpenTopoMap + overlay Waymarked Trails (ne scrapovat Mapy.cz).
- Silnice z OSRM, aktivní den silnější čára; `tam` / `zpět` barvy; trajekt přerušovaně + ikona lodi.
- **Zámek celé trasy** (tlačítko mapy mezi Předchozí / Další): před začátkem a po konci výpravy se ukáže celý okruh; během výpravy se podle dne v Europe/Prague zoomuje na den.
- Pinch zoom, kolečko jen s Ctrl; na mobilu záložky Itinerář / Mapa / Detail dne.
- Trek: červená OSM trasa, GPX ke stažení, tlačítko GPS (poloha telefonu), výškový profil s popisky start / cíl / POI.

### Body a navigace

- **Vlaječka státu** podle `place.country` (`src/lib/flagMarker.ts`, flagcdn). Aktivní den je větší a vlajka „mává“ rychleji.
- **Ubytování** — černý pin s domkem, adresa, poznámky, navigace.
- **Cíl dne** — „Navigovat na cíl dne“.
- **Každé POI s `placeId`** — stejný dialog navigace jako u cíle.
- Dialog: Google Maps, Waze, Apple Maps, systémová navigace; souřadnice v textu.

Do `flagMarker.ts` doplň nové země: `Srbsko: "rs"`, `Bulharsko: "bg"`, `Severní Makedonie: "mk"`, `Maďarsko: "hu"` atd.

### Počasí (yr.no / MET Norway)

- 5denní předpověď u cíle dne a v popup bodu.
- Produkce: `GET /api/forecast?lat=&lon=` (`api/forecast.js`, User-Agent `vypravy.ironknot.cz/1.0 …`).
- Lokálně: Vite proxy na `api.met.no`.
- Ikony z met.no weathericons.

### Meteoradar

- RainViewer + LibreWXR, historie −4 h, nowcast +120 min.
- Přepínač Radar, přehrávání historie / předpovědi.
- Nad zoomem 7 se radar sám vypne (limit dlaždic), mapa jde zoomovat dál.

### Doprava

- Odhad času při max **110 km/h** z OSRM km.
- Live zdržení: `GET /api/traffic?from=lat,lng&to=lat,lng` (TomTom Routing).
- Stavby / uzavírky / nehody na mapě: `GET /api/incidents?path=lng,lat;…` (TomTom Incident Details podél geometrie dne).
- Bez `TOMTOM_API_KEY` jen odhad 110 km/h, žádná chybová hláška.

### Služby podél trasy (koridor)

- Runtime filtr: benzínky ≤ 20 km od čáry dne, nabíječky ≤ 25 km, nemocnice a veterina ≤ 50 km.
- **Na mapě defaultně vypnuté** — zapínají se tlačítky Benzínky / Nabíjení / Nemocnice / Veterina / Přechody vedle radaru. Bez zapnutí mapa zůstane čistá (trasa, vlajky, ubytování).
- V detailu dne stejné služby jako rozbalovací seznamy (nejsou nakreslené na mapě, dokud uživatel vrstvu nezapne).
- Navigace a telefon z Overpass tagů; tísňová 112 jako fallback.
- Alternativní hraniční přechody: ikona ZOLL/DOUANE na mapě (plánované i alternativy), stejný úsek hranice, zajížďka ≤ 90 min (OSRM). V itineráři seznam s otevírací dobou. `npm run fetch:borders`.
- EV (s-b-sm-26): Tesla Supercharger + DC, Overpass `overpass.openstreetmap.fr`. n-s-26 má benzínky, ne nabíječky.

### Obchody a rybaření (volitelné)

- `shops.json` — body podél koridoru (v referenční výpravě IKEA). Pro novou cestu může být prázdné pole `shops`.
- `fishing-spots.json` — stejně; prázdné `spots` panel skryje.
- Tyto vrstvy **nejsou povinné** pro funkční klon.

### UI / chování

- Hlavička: titulek z `itinerary.meta`, počet dní / km z OSRM, navigace dnů.
- Odkaz „Cestovní plán“ vede na úvod portálu `/`.
- Privátní výprava: dvě hesla (plný režim s datumy / omezený bez datumů), session v `localStorage`.
- Auto-den: „dnes“ podle `Europe/Prague`.

---

## 5. Soubory, které se při klonu mění vždy

| Soubor | Co nastavit |
| --- | --- |
| `src/tripMeta.ts` | slug, title, public, map bounds |
| `src/main.tsx` | `basename` |
| `vite.config.ts` | `base`, User-Agent, `server.open` |
| `index.html` | title, description |
| `src/lib/flagMarker.ts` | kódy zemí na trase |
| `src/lib/auth.ts` | jen privátní výpravy |
| `scripts/build-routes.mjs` | PLACES, SEGMENTS, DAY_SEGMENTS |
| `src/data/itinerary.json` | texty dnů a karet |
| `src/data/lodgings.json` | hotely s adresou |
| `src/data/shops.json` / `fishing-spots.json` | nebo prázdné |

`MAP_MAX_BOUNDS` pro Balkán např. `[[40.5, 14], [51.5, 26]]` (Česko až Severní Makedonie). Pro Skandinávii referenční `[[40, -5], [72, 35]]`.

---

## 6. Vývoj, build, Vercel

```bash
# kořen portálu
npm install
npm run dev:n-s-26
npm run dev:s-b-sm-26
npm run build
```

Vercel: Root Directory = kořen tohoto repozitáře, Build Command `npm run build`, Output `dist`. Custom domain `vypravy.ironknot.cz`. Env: `TOMTOM_API_KEY`.

User-Agent pro MET Norway a Overpass: `vypravy.ironknot.cz/1.0 github.com/krejirka/N-S-26`.

---

## 7. Referenční výprava n-s-26 (co v ní je)

18 dní, HK → Rostock (TT Lines) → Trelleborg → Oslo/Bærum → Lillehammer → Rondane → Sundalsøra → Trondheim → Laksforsen → Fv17 s trajekty Kilboghamn–Jektvik a Ågskardet–Forøy → Furøy Camping → Graddis → Myrkulla → Valkalampi → Vimmerby → Ales Stenar → trajekt zpět → HK.

Navíc oproti minimálnímu klonu: trajekty, rybářská místa, obchody podél koridoru, dva režimy hesla. To vše je v kódu šablony a nová výprava to může nechat prázdné.

---

## 8. Checklist nové veřejné výpravy

- [ ] Složka `<slug>/` zkopírovaná z `n-s-26/`
- [ ] `TRIP_PUBLIC = true`
- [ ] `base` + `basename` + catalog + vercel rewrite
- [ ] Ubytování: reálná adresa + lat/lng + `lodgings.json`
- [ ] Všechna POI v `PLACES` včetně adres tam, kde dává smysl navigace
- [ ] Karty v itineráři mají `placeId` → tlačítko Navigovat
- [ ] `npm run build:routes` a `npm run fetch:pois`
- [ ] Vlaječky zemí
- [ ] `index.html` titulek = název výpravy
- [ ] Ověření v prohlížeči: itinerář, mapa, detail, navigace, radar, předpověď
