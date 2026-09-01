/**
 * Match official customs/border posts to a trip route.
 * Planned = closest catalog post per border pair on the route (≤ 30 km).
 * Alternatives = same pair, zajížďka ≤ 90 min (OSRM).
 *
 * Run from a trip folder: `npm run fetch:borders`
 */
import fs from "fs";
import path from "path";
import { BORDER_CATALOG } from "./border-catalog.mjs";

const PLANNED_ROUTE_KM = 30;
const ALT_ROUTE_KM = 90;
const DETOUR_MIN = 90;
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

function routePoints(segments) {
  const latLng = [];
  const lngLat = [];
  for (const seg of segments) {
    if (seg.kind === "ferry" || !seg.geometry?.length) continue;
    for (const pt of seg.geometry) {
      lngLat.push(pt);
      latLng.push([pt[1], pt[0]]);
    }
  }
  return { latLng, lngLat };
}

function minDistKm(lat, lng, samplesLatLng) {
  let min = Infinity;
  const step = Math.max(1, Math.floor(samplesLatLng.length / 8000));
  for (let i = 0; i < samplesLatLng.length; i += step) {
    const [sLat, sLng] = samplesLatLng[i];
    const d = haversine(lat, lng, sLat, sLng);
    if (d < min) min = d;
  }
  return min;
}

function nearestIndex(geomLngLat, lat, lng) {
  let best = 0;
  let bestD = Infinity;
  const step = Math.max(1, Math.floor(geomLngLat.length / 4000));
  for (let i = 0; i < geomLngLat.length; i += step) {
    const d = haversine(lat, lng, geomLngLat[i][1], geomLngLat[i][0]);
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
const { latLng, lngLat } = routePoints(routes.segments);
console.log(`Route points: ${latLng.length}`);

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
  }
  const routeKm = minDistKm(lat, lng, latLng);
  located.push({ ...item, lat, lng, routeKm });
  console.log(`route ${item.id} ${routeKm.toFixed(1)} km`);
}

const pairBest = new Map();
for (const p of located) {
  if (p.routeKm > PLANNED_ROUTE_KM) continue;
  const prev = pairBest.get(p.pair);
  if (!prev || p.routeKm < prev.routeKm) pairBest.set(p.pair, p);
}
const planned = [...pairBest.values()].sort((a, b) => a.routeKm - b.routeKm);
console.log(
  `Planned on route: ${planned.map((p) => `${p.name} (${p.routeKm.toFixed(1)} km)`).join("; ") || "(none)"}`
);

const alternatives = [];
const skipped = [];
for (const alt of located) {
  if (planned.some((p) => p.id === alt.id)) continue;
  const nearest = planned.find((p) => p.pair === alt.pair);
  if (!nearest) continue;
  const airKm = haversine(nearest.lat, nearest.lng, alt.lat, alt.lng);
  if (airKm > ALT_ROUTE_KM || alt.routeKm > ALT_ROUTE_KM) continue;

  const idx = nearestIndex(lngLat, nearest.lat, nearest.lng);
  const before = walkKm(lngLat, idx, LOOK_ALONG_KM, -1);
  const after = walkKm(lngLat, idx, LOOK_ALONG_KM, 1);
  process.stdout.write(`OSRM ${alt.name} vs ${nearest.name}... `);
  const [baseSec, toAlt, fromAlt] = await Promise.all([
    osrmDurationSec(before, after),
    osrmDurationSec(before, [alt.lng, alt.lat]),
    osrmDurationSec([alt.lng, alt.lat], after),
  ]);
  await sleep(150);

  let detourMin;
  if (baseSec == null || toAlt == null || fromAlt == null) {
    detourMin = Math.round((Math.max(0, airKm) / 70) * 60);
    console.log(`approx +${detourMin} min (no OSRM)`);
  } else {
    detourMin = Math.round((toAlt + fromAlt - baseSec) / 60);
    console.log(`ok +${detourMin} min / ${airKm.toFixed(1)} km`);
  }
  if (detourMin < 0) detourMin = Math.round(airKm * 0.8);
  if (detourMin > DETOUR_MIN) {
    console.log(`  skip (+${detourMin} min > ${DETOUR_MIN})`);
    skipped.push({
      id: alt.id,
      name: alt.name,
      pair: alt.pair,
      nearPlannedName: nearest.name,
      airKm: Math.round(airKm * 10) / 10,
      detourMin,
    });
    continue;
  }
  alternatives.push({
    id: alt.id,
    name: alt.name,
    lat: alt.lat,
    lng: alt.lng,
    pair: alt.pair,
    kind: "alternative",
    nearPlannedId: nearest.id,
    nearPlannedName: nearest.name,
    airKm: Math.round(airKm * 10) / 10,
    detourMin,
    openingHoursLabel: alt.openingHoursLabel,
    note: alt.note || null,
  });
}

alternatives.sort((a, b) => a.detourMin - b.detourMin || a.airKm - b.airKm);

fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      note: "Alternativní clo/přechody: stejný úsek hranice, zajížďka ≤90 min (OSRM).",
      generatedAt: new Date().toISOString(),
      planned: planned.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        pair: p.pair,
        kind: "planned",
        openingHoursLabel: p.openingHoursLabel,
        note: p.note || null,
      })),
      alternatives,
      skipped,
    },
    null,
    2
  ) + "\n"
);
console.log(`Wrote ${planned.length} planned + ${alternatives.length} alternatives → ${outPath}`);
