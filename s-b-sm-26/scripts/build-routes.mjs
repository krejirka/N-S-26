import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "data");

const PLACES = {
  hradec_kralove: {
    name: "Hradec Králové",
    lat: 50.2092,
    lng: 15.8328,
    country: "Česko",
    dayLabel: "1/6",
  },
  subotica: {
    name: "Garni Hotel Royal Crown, Subotica",
    lat: 46.09154,
    lng: 19.64898,
    country: "Srbsko",
    dayLabel: "1",
    address: "Somborski put 75, 24000 Subotica, Srbsko",
  },
  crveni_krst: {
    name: "Crveni krst (Niš)",
    lat: 43.33054,
    lng: 21.88864,
    country: "Srbsko",
    dayLabel: "2",
    address: "Bulevar 12. februar, 18104 Niš, Srbsko",
  },
  nis_fortress: {
    name: "Pevnost Niš",
    lat: 43.32577,
    lng: 21.89545,
    country: "Srbsko",
    dayLabel: "2",
  },
  nis: {
    name: "Prenočište Imper I.M.D., Niš",
    lat: 43.32316,
    lng: 21.90096,
    country: "Srbsko",
    dayLabel: "2",
    address: "7. juli 22, 18000 Niš, Srbsko",
  },
  belgrade_360deck: {
    name: "Belgrade 360DECK",
    lat: 44.8176,
    lng: 20.4633,
    country: "Srbsko",
    dayLabel: "2",
    address: "Nikolaja Kravcova 1, Kula Beograd (Galerija, 2. patro), Bělehrad",
  },
  nislijska_mehana: {
    name: "Nišlijska mehana",
    lat: 43.32278,
    lng: 21.9025,
    country: "Srbsko",
    dayLabel: "2",
    address: "Prvomajska 49 / Kralja Stefana Prvovenčanog 22, 18000 Niš, Srbsko",
  },
  stambolijski: {
    name: "Restoran Stambolijski",
    lat: 43.31868,
    lng: 21.89323,
    country: "Srbsko",
    dayLabel: "2",
    address: "Nikole Pašića 36, 18105 Niš, Srbsko",
  },
  cele_kula: {
    name: "Ćele kula, Niš",
    lat: 43.3121,
    lng: 21.9238,
    country: "Srbsko",
    dayLabel: "3",
    address: "Bulevar dr Zorana Đinđića 78, 18108 Niš, Srbsko",
  },
  pirot: {
    name: "Pirotská peglaná klobása (Pirot)",
    lat: 43.16048,
    lng: 22.58982,
    country: "Srbsko",
    dayLabel: "3",
    address: "Trg republike 29, 18300 Pirot, Srbsko",
  },
  borovets: {
    name: "Park Hotel Ela, Borovec",
    lat: 42.26725,
    lng: 23.60386,
    country: "Bulharsko",
    dayLabel: "3–4",
    address: "кк Боровец, 2010 Borovec, Bulharsko",
  },
  jastrebec_gondola: {
    name: "Lanovka Jastrebec (dolní stanice)",
    lat: 42.26633,
    lng: 23.60311,
    country: "Bulharsko",
    dayLabel: "4",
    address: "Yastrebets Gondola, 2010 Borovec, Bulharsko",
  },
  jastrebec: {
    name: "Jastrebec (2 369 m)",
    lat: 42.22694,
    lng: 23.58083,
    country: "Bulharsko",
    dayLabel: "4",
  },
  musala: {
    name: "Musala (2 925 m)",
    lat: 42.17919,
    lng: 23.58528,
    country: "Bulharsko",
    dayLabel: "4",
  },
  rila: {
    name: "Rilský klášter",
    lat: 42.1333,
    lng: 23.34019,
    country: "Bulharsko",
    dayLabel: "5",
    address: "Rilski manastir 107, 2643 Rila, Bulharsko",
  },
  kumanovo: {
    name: "KOKINO Winery & Hotel, Kumanovo",
    lat: 42.15627,
    lng: 21.73013,
    country: "Severní Makedonie",
    dayLabel: "5",
    address: "Kozjacka 15, 1300 Kumanovo, Severní Makedonie",
  },
  palace_garden: {
    name: "Palace Garden, Kumanovo",
    lat: 42.1245,
    lng: 21.7378,
    country: "Severní Makedonie",
    dayLabel: "5",
    address: "R1204, Dobrošane / Kumanovo, Severní Makedonie",
  },
  avala: {
    name: "Avala (TV vysílač)",
    lat: 44.68909,
    lng: 20.51594,
    country: "Srbsko",
    dayLabel: "6",
  },
  kalemegdan: {
    name: "Kalemegdan, Bělehrad",
    lat: 44.82339,
    lng: 20.45088,
    country: "Srbsko",
    dayLabel: "6",
  },
  saint_sava: {
    name: "Chrám sv. Sávy, Bělehrad",
    lat: 44.79805,
    lng: 20.46919,
    country: "Srbsko",
    dayLabel: "6",
    address: "Krušedolska 2a, 11167 Bělehrad, Srbsko",
  },
  tesla_museum: {
    name: "Muzeum Nikoly Tesly, Bělehrad",
    lat: 44.80511,
    lng: 20.4707,
    country: "Srbsko",
    dayLabel: "6",
    address: "Krunska 51, 11000 Bělehrad, Srbsko",
  },
};

const SEGMENTS = [
  { id: "hk_subotica", from: "hradec_kralove", to: "subotica", kind: "road", phase: "tam", dayLabel: "1" },
  { id: "subotica_nis", from: "subotica", to: "nis", kind: "road", phase: "tam", dayLabel: "2" },
  { id: "nis_pirot", from: "nis", to: "pirot", kind: "road", phase: "tam", dayLabel: "3" },
  { id: "pirot_borovets", from: "pirot", to: "borovets", kind: "road", phase: "tam", dayLabel: "3" },
  { id: "borovets_rila", from: "borovets", to: "rila", kind: "road", phase: "tam", dayLabel: "5" },
  { id: "rila_kumanovo", from: "rila", to: "kumanovo", kind: "road", phase: "tam", dayLabel: "5" },
  { id: "kumanovo_avala", from: "kumanovo", to: "avala", kind: "road", phase: "zpět", dayLabel: "6" },
  { id: "avala_hk", from: "avala", to: "hradec_kralove", kind: "road", phase: "zpět", dayLabel: "6" },
];

const DAY_SEGMENTS = {
  1: ["hk_subotica"],
  2: ["subotica_nis"],
  3: ["nis_pirot", "pirot_borovets"],
  4: [],
  5: ["borovets_rila", "rila_kumanovo"],
  6: ["kumanovo_avala", "avala_hk"],
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

async function fetchOsrm(from, to, via = []) {
  const points = [from, ...via, to];
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
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
      result = await fetchOsrm(from, to, seg.via ?? []);
    }

    totalDistanceKm += result.distanceKm;
    segments.push({
      ...seg,
      name: seg.name ?? `${from.name} → ${to.name}`,
      distanceKm: result.distanceKm,
      durationHours: result.durationHours,
      geometry: result.geometry,
      source: seg.source ?? (seg.kind === "ferry" ? "Ferry terminal connection" : "OSRM / OpenStreetMap"),
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
