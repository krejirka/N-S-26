/**
 * Fetch fuel / hospital / veterinary POIs near the trip route via Overpass.
 * Lighter sampling to avoid timeouts. Output: src/data/corridor-pois.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const routesPath = path.join(root, "src", "data", "routes.json");
const outPath = path.join(root, "src", "data", "corridor-pois.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sampleGeometry(geometry, stepKm = 60) {
  if (!geometry?.length) return [];
  const out = [[geometry[0][1], geometry[0][0]]];
  let acc = 0;
  for (let i = 1; i < geometry.length; i++) {
    const [lng0, lat0] = geometry[i - 1];
    const [lng1, lat1] = geometry[i];
    acc += haversine(lat0, lng0, lat1, lng1);
    if (acc >= stepKm) {
      out.push([lat1, lng1]);
      acc = 0;
    }
  }
  const last = geometry[geometry.length - 1];
  out.push([last[1], last[0]]);
  return out;
}

async function overpass(query) {
  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
  ];
  let lastErr;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "vypravy.ironknot.cz/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        lastErr = new Error(`${res.status}`);
        continue;
      }
      return res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function poiFromEl(e, kind) {
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  if (lat == null || lng == null) return null;
  const t = e.tags || {};
  const name = t.name || t["name:en"] || (kind === "fuel" ? "Čerpací stanice" : kind === "hospital" ? "Nemocnice" : "Veterina");
  const address = [t["addr:street"], t["addr:housenumber"], t["addr:city"] || t["addr:place"]]
    .filter(Boolean)
    .join(" ");
  return {
    id: `${kind}-${e.type?.[0] || "n"}${e.id}`,
    kind,
    name,
    address: address || undefined,
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
    emergency: t.emergency === "yes" || t.opening_hours === "24/7",
    fuel95: t["fuel:octane_95"] === "yes" || t["fuel:petrol"] === "yes" || kind === "fuel",
  };
}

const routes = JSON.parse(fs.readFileSync(routesPath, "utf8"));
const samples = [];
const seenKey = new Set();
for (const seg of routes.segments) {
  if (seg.kind === "ferry") continue;
  for (const p of sampleGeometry(seg.geometry, 60)) {
    const k = `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    if (seenKey.has(k)) continue;
    seenKey.add(k);
    samples.push(p);
  }
}
console.log(`Sample points: ${samples.length}`);

const byId = new Map();
const CHUNK = 6;

async function fetchAround(kind, filterExpr, radiusM) {
  for (let i = 0; i < samples.length; i += CHUNK) {
    const chunk = samples.slice(i, i + CHUNK);
    const parts = [];
    for (const [lat, lng] of chunk) {
      parts.push(`node${filterExpr}(around:${radiusM},${lat},${lng});`);
      parts.push(`way${filterExpr}(around:${radiusM},${lat},${lng});`);
    }
    const query = `[out:json][timeout:60];(${parts.join("")});out center tags;`;
    process.stdout.write(`${kind} ${i / CHUNK + 1}/${Math.ceil(samples.length / CHUNK)}... `);
    try {
      const data = await overpass(query);
      let n = 0;
      for (const el of data.elements || []) {
        const poi = poiFromEl(el, kind);
        if (!poi || byId.has(poi.id)) continue;
        byId.set(poi.id, poi);
        n++;
      }
      console.log(`+${n}`);
    } catch (e) {
      console.log(`FAIL ${e.message || e}`);
    }
    await sleep(1500);
  }
}

await fetchAround("fuel", '["amenity"="fuel"]', 20000);
await fetchAround("hospital", '["amenity"="hospital"]["emergency"="yes"]', 50000);
await fetchAround("veterinary", '["amenity"="veterinary"]', 50000);

const pois = [...byId.values()];
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      note: "POI podél trasy (OSM/Overpass). Runtime filtruje dle aktivního dne (20/50 km).",
      generatedAt: new Date().toISOString(),
      pois,
    },
    null,
    2
  ) + "\n"
);
console.log(`Wrote ${pois.length} POIs → ${outPath}`);
