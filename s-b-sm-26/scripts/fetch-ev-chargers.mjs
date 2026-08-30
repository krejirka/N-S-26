/**
 * Fetch EV charging stations along the trip (Tesla-oriented: DC / CCS / Supercharger).
 * Writes src/data/ev-chargers.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const routesPath = path.join(root, "src", "data", "routes.json");
const outPath = path.join(root, "src", "data", "ev-chargers.json");

const MIN_KW = 50;
const CORRIDOR_KM = 25;
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

function parseKw(raw) {
  if (raw == null || raw === "") return 0;
  const nums = [...String(raw).replace(",", ".").matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : 0;
}

function maxKwFromTags(t) {
  let max = 0;
  for (const [k, v] of Object.entries(t)) {
    if (k === "maxpower" || k === "charging_station:output" || /:output$/.test(k) || k.endsWith(":current")) {
      if (k.endsWith(":current")) continue;
      max = Math.max(max, parseKw(v));
    }
  }
  return max;
}

function isTesla(t) {
  const blob = `${t.brand || ""} ${t.operator || ""} ${t.name || ""} ${t.network || ""}`.toLowerCase();
  return blob.includes("tesla") || t["tesla:supercharger"] === "yes";
}

function hasDcSocket(t) {
  return Boolean(
    t["socket:type2_combo"] ||
      t["socket:tesla_supercharger"] ||
      t["socket:tesla_supercharger_ccs"] ||
      t["socket:chademo"] ||
      t["socket:ccs"] ||
      /dc|combo|ccs|supercharger/i.test(t.socket || "")
  );
}

function socketsLabel(t) {
  const parts = [];
  const tesla = t["socket:tesla_supercharger"] || t["socket:tesla_supercharger_ccs"];
  const ccs = t["socket:type2_combo"] || t["socket:ccs"];
  const t2 = t["socket:type2"];
  const cha = t["socket:chademo"];
  if (tesla) parts.push(`Tesla Supercharger${Number(tesla) > 1 ? ` ×${tesla}` : ""}`);
  if (ccs) parts.push(`CCS${Number(ccs) > 1 ? ` ×${ccs}` : ""}`);
  if (t2) parts.push(`Type 2${Number(t2) > 1 ? ` ×${t2}` : ""}`);
  if (cha) parts.push(`CHAdeMO${Number(cha) > 1 ? ` ×${cha}` : ""}`);
  return parts.length ? parts.join(" · ") : null;
}

function hoursLabel(oh) {
  if (!oh || !String(oh).trim()) return "Otevírací doba v OSM není uvedená";
  const s = String(oh).trim();
  if (/^24\s*\/\s*7$/i.test(s) || s === "Mo-Su 00:00-24:00" || s === "00:00-24:00") return "Nonstop (24/7)";
  return s;
}

function powerLabel(kw, tesla) {
  if (kw >= 1) return `${Math.round(kw)} kW`;
  if (tesla) return "Tesla Supercharger (kW v OSM neuveden)";
  return "výkon v OSM neuveden";
}

function fromEl(e) {
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  if (lat == null || lng == null) return null;
  const t = e.tags || {};
  if (t.access === "private" || t.access === "no") return null;
  const tesla = isTesla(t);
  const kw = maxKwFromTags(t);
  const dc = hasDcSocket(t);
  if (!tesla && kw < MIN_KW) return null;
  const name =
    t.name ||
    t["name:en"] ||
    t.brand ||
    t.operator ||
    (tesla ? "Tesla Supercharger" : "Nabíjecí stanice");
  const address = [t["addr:street"], t["addr:housenumber"], t["addr:city"] || t["addr:place"]]
    .filter(Boolean)
    .join(" ");
  return {
    id: `ev-${e.type?.[0] || "n"}${e.id}`,
    name,
    operator: t.operator || t.brand || null,
    tesla,
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
    maxKw: kw || null,
    powerLabel: powerLabel(kw, tesla),
    sockets: socketsLabel(t),
    openingHours: t.opening_hours || null,
    openingHoursLabel: hoursLabel(t.opening_hours),
    address: address || undefined,
    website: t.website || t["contact:website"] || null,
  };
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
console.log(`Route samples: ${samples.length}`);

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
  const query = `[out:json][timeout:90];(node["amenity"="charging_station"](${bb});way["amenity"="charging_station"](${bb}););out center tags;`;
  process.stdout.write(`bbox ${i + 1}/${boxes.length}... `);
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

const chargers = [...byId.values()].sort((a, b) => (b.maxKw || 0) - (a.maxKw || 0) || a.name.localeCompare(b.name, "cs"));
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      note: "DC / CCS / Tesla Supercharger ≤25 km od trasy, přednostně ≥50 kW.",
      generatedAt: new Date().toISOString(),
      chargers,
    },
    null,
    2
  ) + "\n"
);
console.log(`Wrote ${chargers.length} chargers → ${outPath}`);
