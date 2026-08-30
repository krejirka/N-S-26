/**
 * Fetch amenity=fuel along the trip and merge into corridor-pois.json
 * (keeps existing hospital/vet). Bbox Overpass + 20 km corridor filter.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const routesPath = path.join(root, "src", "data", "routes.json");
const outPath = path.join(root, "src", "data", "corridor-pois.json");
const CORRIDOR_KM = 20;
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

function sampleGeometry(geometry, stepKm = 70) {
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

function minDistToSamples(lat, lng, samples) {
  let min = Infinity;
  for (const [sLat, sLng] of samples) {
    const d = haversine(lat, lng, sLat, sLng);
    if (d < min) min = d;
  }
  return min;
}

async function overpass(query) {
  const endpoints = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  let lastErr;
  for (const url of endpoints) {
    for (let attempt = 0; attempt < 2; attempt++) {
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
        if (res.status === 429 || res.status === 504) {
          lastErr = new Error(`${res.status}`);
          await sleep(4000);
          continue;
        }
        if (!res.ok) {
          lastErr = new Error(`${res.status} ${url}`);
          break;
        }
        return res.json();
      } catch (e) {
        lastErr = e;
        await sleep(1500);
      }
    }
  }
  throw lastErr;
}

function fromEl(e) {
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  if (lat == null || lng == null) return null;
  const t = e.tags || {};
  const name = t.name || t["name:en"] || t.brand || "Čerpací stanice";
  const address = [t["addr:street"], t["addr:housenumber"], t["addr:city"] || t["addr:place"]]
    .filter(Boolean)
    .join(" ");
  return {
    id: `fuel-${e.type?.[0] || "n"}${e.id}`,
    kind: "fuel",
    name,
    address: address || undefined,
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
    emergency: t.opening_hours === "24/7",
    fuel95: t["fuel:octane_95"] === "yes" || t["fuel:petrol"] === "yes" || true,
    phone: t.phone || t["contact:phone"] || undefined,
    website: t.website || t["contact:website"] || undefined,
  };
}

const existing = fs.existsSync(outPath)
  ? JSON.parse(fs.readFileSync(outPath, "utf8"))
  : { pois: [] };
const keep = (existing.pois || []).filter((p) => p.kind !== "fuel");

const routes = JSON.parse(fs.readFileSync(routesPath, "utf8"));
const samples = [];
const seen = new Set();
for (const seg of routes.segments) {
  if (seg.kind === "ferry") continue;
  for (const p of sampleGeometry(seg.geometry, 70)) {
    const k = `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    samples.push(p);
  }
}

const boxes = [
  [48.4, 15.4, 50.5, 19.8],
  [45.7, 16.8, 48.5, 21.2],
  [42.8, 19.3, 45.8, 23.2],
  [41.5, 20.6, 43.1, 24.1],
  [43.8, 18.8, 47.2, 22.4],
];

const byId = new Map();
for (let i = 0; i < boxes.length; i++) {
  const [s, w, n, e] = boxes[i];
  const bb = `${s},${w},${n},${e}`;
  const query = `[out:json][timeout:90];(node["amenity"="fuel"](${bb});way["amenity"="fuel"](${bb}););out center tags;`;
  process.stdout.write(`fuel bbox ${i + 1}/${boxes.length}... `);
  try {
    const data = await overpass(query);
    let nAdd = 0;
    for (const el of data.elements || []) {
      const poi = fromEl(el);
      if (!poi || byId.has(poi.id)) continue;
      if (minDistToSamples(poi.lat, poi.lng, samples) > CORRIDOR_KM) continue;
      byId.set(poi.id, poi);
      nAdd++;
    }
    console.log(`+${nAdd} (raw ${(data.elements || []).length})`);
  } catch (err) {
    console.log(`FAIL ${err.message || err}`);
  }
  await sleep(1200);
}

const fuels = [...byId.values()];
const pois = [...keep, ...fuels];
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      note: "Nemocnice, veterina a benzínky podél trasy (OSM). Na mapě defaultně skryté — zapnout tlačítkem.",
      generatedAt: new Date().toISOString(),
      pois,
    },
    null,
    2
  ) + "\n"
);
console.log(`Wrote ${pois.length} POIs (${fuels.length} fuel) → ${outPath}`);
