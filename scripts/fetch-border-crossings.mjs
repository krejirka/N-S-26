/**
 * Match official customs/border posts to a trip route.
 * Planned = on the route (≤ 5 km). Alternatives = ≤ 100 km air, ≤ 120 min OSRM detour.
 *
 * Run from a trip folder: `npm run fetch:borders`
 */
import fs from "fs";
import path from "path";
import { BORDER_CATALOG } from "./border-catalog.mjs";

const AIR_KM = 100;
const DETOUR_MIN = 120;
const PLANNED_ROUTE_KM = 8;
const LOOK_ALONG_KM = 35;
const OSRM = "https://router.project-osrm.org/route/v1/driving";

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

function sampleRoute(segments, stepKm = 8) {
  const samples = [];
  const full = [];
  for (const seg of segments) {
    if (seg.kind === "ferry" || !seg.geometry?.length) continue;
    for (const pt of seg.geometry) full.push(pt);
    let acc = stepKm;
    for (let i = 1; i < seg.geometry.length; i++) {
      const [lng0, lat0] = seg.geometry[i - 1];
      const [lng1, lat1] = seg.geometry[i];
      acc += haversine(lat0, lng0, lat1, lng1);
      if (acc >= stepKm) {
        samples.push([lat1, lng1]);
        acc = 0;
      }
    }
  }
  return { samples, full };
}

function minDistKm(lat, lng, samplesLatLng) {
  let min = Infinity;
  for (const [sLat, sLng] of samplesLatLng) {
    const d = haversine(lat, lng, sLat, sLng);
    if (d < min) min = d;
  }
  return min;
}

function nearestIndex(geom, lat, lng) {
  let best = 0;
  let bestD = Infinity;
  const step = Math.max(1, Math.floor(geom.length / 4000));
  for (let i = 0; i < geom.length; i += step) {
    const d = haversine(lat, lng, geom[i][1], geom[i][0]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function walkKm(geom, startIdx, km, direction) {
  let left = km;
  let i = startIdx;
  while (left > 0) {
    const ni = i + direction;
    if (ni < 0 || ni >= geom.length) return geom[i];
    const d = haversine(geom[i][1], geom[i][0], geom[ni][1], geom[ni][0]);
    if (d <= 1e-6) {
      i = ni;
      continue;
    }
    if (d >= left) {
      const t = left / d;
      return [
        geom[i][0] + t * (geom[ni][0] - geom[i][0]),
        geom[i][1] + t * (geom[ni][1] - geom[i][1]),
      ];
    }
    left -= d;
    i = ni;
  }
  return geom[i];
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "vypravy.ironknot.cz/1.0 github.com/krejirka/N-S-26", Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

async function osrmDurationSec(fromLngLat, toLngLat) {
  const coords = `${fromLngLat[0]},${fromLngLat[1]};${toLngLat[0]},${toLngLat[1]}`;
  const url = `${OSRM}/${coords}?overview=false`;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { "User-Agent": "vypravy.ironknot.cz/1.0" } });
    if (res.status === 429) {
      await sleep(1200 * (i + 1));
      continue;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const sec = data.routes?.[0]?.duration;
    return Number.isFinite(sec) ? sec : null;
  }
  return null;
}

const tripRoot = process.cwd();
const routesPath = path.join(tripRoot, "src", "data", "routes.json");
const outPath = path.join(tripRoot, "src", "data", "border-crossings.json");
if (!fs.existsSync(routesPath)) {
  throw new Error(`Missing ${routesPath}`);
}

const routes = JSON.parse(fs.readFileSync(routesPath, "utf8"));
const { samples, full } = sampleRoute(routes.segments);
console.log(`Route samples: ${samples.length}`);

const located = [];
for (const item of BORDER_CATALOG) {
  let lat = item.lat;
  let lng = item.lng;
  if (lat == null || lng == null) {
    process.stdout.write(`geocode ${item.id}... `);
    const hit = await geocode(item.query);
    await sleep(1100);
    if (!hit) {
      console.log("miss");
      continue;
    }
    lat = Math.round(hit.lat * 1e5) / 1e5;
    lng = Math.round(hit.lng * 1e5) / 1e5;
    console.log(`${lat}, ${lng}`);
  } else {
    console.log(`coords ${item.id} ${lat}, ${lng}`);
  }
  located.push({ ...item, lat, lng });
}

const withDist = located.map((p) => ({ ...p, routeKm: minDistKm(p.lat, p.lng, samples) }));
const onRoute = withDist.filter((p) => p.routeKm <= PLANNED_ROUTE_KM);
const planned = [];
for (const p of onRoute.sort((a, b) => a.routeKm - b.routeKm)) {
  if (planned.some((x) => haversine(x.lat, x.lng, p.lat, p.lng) < 20)) continue;
  planned.push(p);
}
console.log(`Planned on route: ${planned.map((p) => `${p.name} (${p.routeKm.toFixed(1)} km)`).join("; ") || "(none)"}`);

const alternatives = [];
for (const alt of located) {
  if (planned.some((p) => p.id === alt.id)) continue;
  let nearest = null;
  let airKm = Infinity;
  for (const p of planned) {
    const d = haversine(p.lat, p.lng, alt.lat, alt.lng);
    if (d < airKm) {
      airKm = d;
      nearest = p;
    }
  }
  if (!nearest || nearest.pair !== alt.pair || airKm > AIR_KM || airKm < 1) continue;

  const idx = nearestIndex(full, nearest.lat, nearest.lng);
  const before = walkKm(full, idx, LOOK_ALONG_KM, -1);
  const after = walkKm(full, idx, LOOK_ALONG_KM, 1);
  process.stdout.write(`OSRM ${alt.name} vs ${nearest.name}... `);
  const [baseSec, toAlt, fromAlt] = await Promise.all([
    osrmDurationSec(before, after),
    osrmDurationSec(before, [alt.lng, alt.lat]),
    osrmDurationSec([alt.lng, alt.lat], after),
  ]);
  await sleep(150);
  if (baseSec == null || toAlt == null || fromAlt == null) {
    console.log("skip (no route)");
    continue;
  }
  const detourMin = Math.round((toAlt + fromAlt - baseSec) / 60);
  if (detourMin > DETOUR_MIN) {
    console.log(`skip (+${detourMin} min)`);
    continue;
  }
  console.log(`ok +${detourMin} min / ${airKm.toFixed(1)} km`);
  alternatives.push({
    id: alt.id,
    name: alt.name,
    lat: alt.lat,
    lng: alt.lng,
    pair: alt.pair,
    nearPlannedId: nearest.id,
    nearPlannedName: nearest.name,
    airKm: Math.round(airKm * 10) / 10,
    detourMin,
    openingHoursLabel: alt.openingHoursLabel,
    note: alt.note || null,
  });
}

alternatives.sort((a, b) => a.airKm - b.airKm);

fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      note: "Alternativní clo/přechody: ≤100 km vzdušnou čarou od plánovaného, zajížďka ≤120 min (OSRM).",
      generatedAt: new Date().toISOString(),
      planned: planned.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        pair: p.pair,
        openingHoursLabel: p.openingHoursLabel,
      })),
      alternatives,
    },
    null,
    2
  ) + "\n"
);
console.log(`Wrote ${alternatives.length} alternatives → ${outPath}`);
