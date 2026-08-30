/**
 * Seed corridor POIs near key overnight / city stops via Nominatim (reliable).
 * Full corridor refresh: npm run fetch:pois (Overpass, may rate-limit).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "src", "data", "corridor-pois.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QUERIES = [
  // fuel near corridor hubs
  { kind: "fuel", q: "Circle K Hradec Kralove" },
  { kind: "fuel", q: "Shell Rostock Zum Fahrterminal" },
  { kind: "fuel", q: "Circle K Trelleborg" },
  { kind: "fuel", q: "Circle K Malmo" },
  { kind: "fuel", q: "Circle K Goteborg" },
  { kind: "fuel", q: "Circle K Sandvika" },
  { kind: "fuel", q: "Circle K Lillehammer" },
  { kind: "fuel", q: "Circle K Trondheim" },
  { kind: "fuel", q: "Circle K Mo i Rana" },
  { kind: "fuel", q: "Circle K Arvidsjaur" },
  { kind: "fuel", q: "Circle K Gavle" },
  { kind: "fuel", q: "Circle K Vimmerby" },
  { kind: "fuel", q: "OKQ8 Valbo" },
  { kind: "fuel", q: "Uno-X Ornes Norway" },
  // hospitals with emergency
  { kind: "hospital", q: "Fakultni nemocnice Hradec Kralove" },
  { kind: "hospital", q: "Universitätsmedizin Rostock" },
  { kind: "hospital", q: "Skane University Hospital Malmo" },
  { kind: "hospital", q: "Sahlgrenska University Hospital Gothenburg" },
  { kind: "hospital", q: "Oslo University Hospital Ullevaal" },
  { kind: "hospital", q: "Sykehuset Innlandet Lillehammer" },
  { kind: "hospital", q: "St Olavs hospital Trondheim" },
  { kind: "hospital", q: "Helgelandssykehuset Mo i Rana" },
  { kind: "hospital", q: "Sunderby hospital Lulea" },
  { kind: "hospital", q: "Gavle sjukhus" },
  { kind: "hospital", q: "Vastervik hospital" },
  // veterinary
  { kind: "veterinary", q: "veterinarni klinika Hradec Kralove" },
  { kind: "veterinary", q: "Tierklinik Rostock" },
  { kind: "veterinary", q: "Djursjukhus Malmo" },
  { kind: "veterinary", q: "Evidensia Goteborg" },
  { kind: "veterinary", q: "AniCura Oslo" },
  { kind: "veterinary", q: "veterinaer Lillehammer" },
  { kind: "veterinary", q: "AniCura Trondheim" },
  { kind: "veterinary", q: "veterinar Arvidsjaur" },
  { kind: "veterinary", q: "Djursjukhus Gavle" },
  { kind: "veterinary", q: "veterinar Vimmerby" },
];

async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": "n-s-26-trip-planner/1.0" } });
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] || null;
}

const pois = [];
let i = 0;
for (const item of QUERIES) {
  i++;
  process.stdout.write(`[${i}/${QUERIES.length}] ${item.kind}: ${item.q}... `);
  const hit = await geocode(item.q);
  await sleep(1100);
  if (!hit) {
    console.log("MISS");
    continue;
  }
  const lat = Math.round(Number(hit.lat) * 1e5) / 1e5;
  const lng = Math.round(Number(hit.lon) * 1e5) / 1e5;
  console.log(`${lat},${lng}`);
  pois.push({
    id: `${item.kind}-${pois.filter((p) => p.kind === item.kind).length + 1}`,
    kind: item.kind,
    name: hit.name || hit.display_name.split(",")[0],
    address: hit.display_name,
    lat,
    lng,
    emergency: item.kind === "hospital" || item.kind === "veterinary",
    fuel95: item.kind === "fuel",
  });
}

fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      note: "Seed POI u klíčových zastávek (Nominatim). Plný koridor: npm run fetch:pois",
      generatedAt: new Date().toISOString(),
      pois,
    },
    null,
    2
  ) + "\n"
);
console.log(`Wrote ${pois.length} POIs`);
