/**
 * Fill elevation profile on an existing hike JSON (Open-Meteo SRTM).
 * Usage: node scripts/fetch-hike-elevation.mjs [src/data/hike-….json]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const defaultPath = path.join(root, "src", "data", "hike-jastrebec-musala.json");
const outPath = path.resolve(process.argv[2] || defaultPath);

const LABEL = {
  Ястребец: "Jastrebec",
  Мусала: "Musala",
  "заслон Леденото езеро": "Ledové jezero",
  Иречек: "Ireček",
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cumulativeKm(track) {
  const km = [0];
  for (let i = 1; i < track.length; i++) {
    km.push(
      km[i - 1] + haversine(track[i - 1][1], track[i - 1][0], track[i][1], track[i][0])
    );
  }
  return km;
}

function sampleIndices(n, count) {
  if (n <= count) return [...Array(n).keys()];
  const out = [];
  for (let i = 0; i < count; i++) out.push(Math.round((i / (count - 1)) * (n - 1)));
  return [...new Set(out)];
}

function nearestIndex(track, lat, lng) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < track.length; i++) {
    const d = haversine(lat, lng, track[i][1], track[i][0]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { index: best, distKm: bestD };
}

async function openMeteoElevation(points) {
  const CHUNK = 80;
  const eles = [];
  for (let i = 0; i < points.length; i += CHUNK) {
    const chunk = points.slice(i, i + CHUNK);
    const url =
      `https://api.open-meteo.com/v1/elevation?latitude=${chunk.map((p) => p.lat).join(",")}` +
      `&longitude=${chunk.map((p) => p.lng).join(",")}`;
    const res = await fetch(url, { headers: { "User-Agent": "vypravy.ironknot.cz/1.0" } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.elevation)) throw new Error("Open-Meteo empty elevation");
    eles.push(...data.elevation);
  }
  return eles;
}

async function buildHikeProfile(hike) {
  const track = hike.track;
  if (!track?.length) throw new Error("hike.track missing");
  const kmAt = cumulativeKm(track);
  const idxs = sampleIndices(track.length, 90);
  const pts = idxs.map((i) => ({ lat: track[i][1], lng: track[i][0], km: kmAt[i] }));
  const rawEle = await openMeteoElevation(pts);

  const samples = pts.map((p, i) => ({
    km: Math.round(p.km * 1000) / 1000,
    ele: Math.round(rawEle[i]),
    lat: p.lat,
    lng: p.lng,
  }));

  const snapKnown = (i, ele) => {
    if (ele != null && Number.isFinite(ele)) samples[i].ele = Math.round(ele);
  };
  const startPoi = (hike.pois || []).find((p) => /ястребец|jastrebec|yastrebets/i.test(p.name));
  const endPoi = (hike.pois || []).find((p) => /^мусала$|^musala$/i.test(p.name));
  snapKnown(0, startPoi?.ele);
  snapKnown(samples.length - 1, endPoi?.ele);

  let ascentM = 0;
  let descentM = 0;
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i].ele - samples[i - 1].ele;
    if (d > 2) ascentM += d;
    else if (d < -2) descentM += -d;
  }

  const labels = [];
  labels.push({
    id: "start",
    name: "Jastrebec",
    km: samples[0].km,
    ele: samples[0].ele,
    kind: "start",
  });

  for (const poi of hike.pois || []) {
    if (poi.kind === "station") continue;
    if (poi.kind === "peak") continue;
    const near = nearestIndex(track, poi.lat, poi.lng);
    if (near.distKm > 0.45) continue;
    const km = Math.round(kmAt[near.index] * 1000) / 1000;
    const ele = poi.ele != null && Number.isFinite(poi.ele) ? Math.round(poi.ele) : samples[Math.round((near.index / (track.length - 1)) * (samples.length - 1))]?.ele;
    labels.push({
      id: poi.id,
      name: LABEL[poi.name] || poi.name,
      km,
      ele,
      kind: poi.kind,
    });
  }

  labels.push({
    id: "end",
    name: "Musala",
    km: samples[samples.length - 1].km,
    ele: samples[samples.length - 1].ele,
    kind: "end",
  });

  const eles = samples.map((s) => s.ele);
  return {
    source: "Open-Meteo elevation (SRTM) + OSM peak heights at ends",
    ascentM: Math.round(ascentM),
    descentM: Math.round(descentM),
    minEle: Math.min(...eles),
    maxEle: Math.max(...eles),
    samples,
    labels,
  };
}

const hike = JSON.parse(fs.readFileSync(outPath, "utf8"));
hike.profile = await buildHikeProfile(hike);
hike.generatedAt = new Date().toISOString();
fs.writeFileSync(outPath, JSON.stringify(hike, null, 2) + "\n");
console.log(
  `Profile ${hike.profile.samples.length} pts, ↑${hike.profile.ascentM} m ↓${hike.profile.descentM} m, ` +
    `${hike.profile.minEle}–${hike.profile.maxEle} m → ${outPath}`
);
console.log("labels:", hike.profile.labels.map((l) => `${l.name} ${l.km} km / ${l.ele} m`).join(" · "));
