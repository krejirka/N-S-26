import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "data");

const PLACES = {
  hradec_kralove: { name: "Hradec Králové", lat: 50.2092, lng: 15.8328, country: "Česko", dayLabel: "1·18" },
  rostock_ferry: { name: "Rostock (trajekt)", lat: 54.1445881, lng: 12.0976681, country: "Německo", dayLabel: "1·17" },
  trelleborg_ferry: { name: "Trelleborg (trajekt)", lat: 55.3699862, lng: 13.1503256, country: "Švédsko", dayLabel: "1·17" },
  oslo: { name: "Oslo", lat: 59.9139, lng: 10.7522, country: "Norsko", dayLabel: "2" },
  lillehammer: { name: "Lillehammer", lat: 61.1153, lng: 10.4662, country: "Norsko", dayLabel: "3" },
  rondane: { name: "NP Rondane", lat: 62.0764, lng: 9.5828, country: "Norsko", dayLabel: "4" },
  sundalsora: { name: "Sundalsora", lat: 62.2436, lng: 8.6136, country: "Norsko", dayLabel: "5" },
  trondheim: { name: "Trondheim", lat: 63.4305, lng: 10.3951, country: "Norsko", dayLabel: "6" },
  laksforsen: { name: "Laksforsen", lat: 65.6641, lng: 13.2694, country: "Norsko", dayLabel: "7" },
  furoy: { name: "Furøy", lat: 66.5342, lng: 13.2844, country: "Norsko", dayLabel: "8–9" },
  junkerdal: { name: "Junkerdal", lat: 66.112, lng: 14.063, country: "Norsko", dayLabel: "10" },
  myrkulla: { name: "Myrkulla (Arvidsjaur)", lat: 65.9397278, lng: 18.8357806, country: "Švédsko", dayLabel: "11–14" },
  axmarbruk: { name: "Axmarbruk", lat: 61.3014, lng: 17.0167, country: "Švédsko", dayLabel: "15" },
  vimmerby: { name: "Vimmerby", lat: 57.6659, lng: 15.8557, country: "Švédsko", dayLabel: "16" },
  ales_stenar: { name: "Ales Stenar", lat: 55.3869, lng: 14.0534, country: "Švédsko", dayLabel: "17" },
};

const SEGMENTS = [
  { id: "hk_rostock", from: "hradec_kralove", to: "rostock_ferry", kind: "road", phase: "tam", dayLabel: "1" },
  { id: "rostock_trelleborg_ferry", from: "rostock_ferry", to: "trelleborg_ferry", kind: "ferry", phase: "tam", dayLabel: "1" },
  { id: "trelleborg_oslo", from: "trelleborg_ferry", to: "oslo", kind: "road", phase: "tam", dayLabel: "2" },
  { id: "oslo_lillehammer", from: "oslo", to: "lillehammer", kind: "road", phase: "tam", dayLabel: "3" },
  { id: "lillehammer_rondane", from: "lillehammer", to: "rondane", kind: "road", phase: "tam", dayLabel: "4" },
  { id: "rondane_sundalsora", from: "rondane", to: "sundalsora", kind: "road", phase: "tam", dayLabel: "5" },
  { id: "sundalsora_trondheim", from: "sundalsora", to: "trondheim", kind: "road", phase: "tam", dayLabel: "6" },
  { id: "trondheim_laksforsen", from: "trondheim", to: "laksforsen", kind: "road", phase: "tam", dayLabel: "7" },
  { id: "laksforsen_furoy", from: "laksforsen", to: "furoy", kind: "road", phase: "tam", dayLabel: "8" },
  { id: "furoy_junkerdal", from: "furoy", to: "junkerdal", kind: "road", phase: "tam", dayLabel: "10" },
  { id: "junkerdal_myrkulla", from: "junkerdal", to: "myrkulla", kind: "road", phase: "tam", dayLabel: "11" },
  { id: "myrkulla_axmarbruk", from: "myrkulla", to: "axmarbruk", kind: "road", phase: "zpět", dayLabel: "15" },
  { id: "axmarbruk_vimmerby", from: "axmarbruk", to: "vimmerby", kind: "road", phase: "zpět", dayLabel: "16" },
  { id: "vimmerby_ales_stenar", from: "vimmerby", to: "ales_stenar", kind: "road", phase: "zpět", dayLabel: "17" },
  { id: "ales_stenar_trelleborg", from: "ales_stenar", to: "trelleborg_ferry", kind: "road", phase: "zpět", dayLabel: "17" },
  { id: "trelleborg_rostock_ferry", from: "trelleborg_ferry", to: "rostock_ferry", kind: "ferry", phase: "zpět", dayLabel: "17" },
  { id: "rostock_hk", from: "rostock_ferry", to: "hradec_kralove", kind: "road", phase: "zpět", dayLabel: "18" },
];

const DAY_SEGMENTS = {
  1: ["hk_rostock", "rostock_trelleborg_ferry"],
  2: ["trelleborg_oslo"],
  3: ["oslo_lillehammer"],
  4: ["lillehammer_rondane"],
  5: ["rondane_sundalsora"],
  6: ["sundalsora_trondheim"],
  7: ["trondheim_laksforsen"],
  8: ["laksforsen_furoy"],
  9: [],
  10: ["furoy_junkerdal"],
  11: ["junkerdal_myrkulla"],
  12: [],
  13: [],
  14: [],
  15: ["myrkulla_axmarbruk"],
  16: ["axmarbruk_vimmerby"],
  17: ["vimmerby_ales_stenar", "ales_stenar_trelleborg", "trelleborg_rostock_ferry"],
  18: ["rostock_hk"],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function roundCoord(n) {
  return Math.round(n * 1e5) / 1e5;
}

function ferryLine(from, to, steps = 24) {
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    coords.push([roundCoord(from.lng + (to.lng - from.lng) * t), roundCoord(from.lat + (to.lat - from.lat) * t)]);
  }
  return coords;
}

async function fetchOsrm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status} for ${from.name} -> ${to.name}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) throw new Error(`OSRM no route: ${from.name} -> ${to.name}`);
  const route = data.routes[0];
  const geometry = route.geometry.coordinates.map(([lng, lat]) => [roundCoord(lng), roundCoord(lat)]);
  return {
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationHours: Math.round((route.duration / 3600) * 10) / 10,
    geometry,
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "places.json"), JSON.stringify({ places: PLACES, daySegments: DAY_SEGMENTS }, null, 2));

  const segments = [];
  let totalDistanceKm = 0;

  for (const seg of SEGMENTS) {
    const from = PLACES[seg.from];
    const to = PLACES[seg.to];
    process.stdout.write(`Routing ${seg.id}... `);

    let result;
    if (seg.kind === "ferry") {
      result = {
        distanceKm: Math.round(haversine(from, to) * 10) / 10,
        durationHours: null,
        geometry: ferryLine(from, to),
      };
    } else {
      await sleep(1200);
      result = await fetchOsrm(from, to);
    }

    totalDistanceKm += result.distanceKm;
    segments.push({
      ...seg,
      name: `${from.name} → ${to.name}`,
      distanceKm: result.distanceKm,
      durationHours: result.durationHours,
      geometry: result.geometry,
      source: seg.kind === "ferry" ? "Ferry terminal connection" : "OSRM / OpenStreetMap",
    });
    console.log(`${result.distanceKm} km`);
  }

  const routes = {
    generatedAt: new Date().toISOString(),
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    segments,
  };

  fs.writeFileSync(path.join(outDir, "routes.json"), JSON.stringify(routes));
  console.log(`Total OSRM distance: ${routes.totalDistanceKm} km`);
}

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
