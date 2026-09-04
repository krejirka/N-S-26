/**
 * Small OpenTopoMap raster pack for the Musala trek (personal offline use).
 * High zoom only near the trail; polite delay + identifiable User-Agent.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const hikePath = path.join(root, "src", "data", "hike-jastrebec-musala.json");
const outRoot = path.join(root, "offline-maps", "otm");

const UA = "vypravy.ironknot.cz/1.0 (personal offline hike tiles for one trek)";
const DELAY_MS = 140;
const WIDE_ZOOMS = [11, 12, 13, 14];
const TRAIL_ZOOMS = [15, 16, 17];
const WIDE_PAD_KM = 15;
const TRAIL_PAD_KM = 4.5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lngLatToTile(lng, lat, z) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

function tileCenter(z, x, y) {
  const n = 2 ** z;
  const lng = (x + 0.5) / n * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / n)));
  return { lat: (latRad * 180) / Math.PI, lng };
}

function bboxOfTrack(track, padKm) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of track) {
    minLon = Math.min(minLon, lng);
    maxLon = Math.max(maxLon, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  const dLat = padKm / 111.32;
  const midLat = (minLat + maxLat) / 2;
  const dLon = padKm / (111.32 * Math.cos((midLat * Math.PI) / 180));
  return { minLon: minLon - dLon, minLat: minLat - dLat, maxLon: maxLon + dLon, maxLat: maxLat + dLat };
}

function tilesInBbox(bbox, z) {
  const nw = lngLatToTile(bbox.minLon, bbox.maxLat, z);
  const se = lngLatToTile(bbox.maxLon, bbox.minLat, z);
  const out = [];
  for (let x = nw.x; x <= se.x; x++) {
    for (let y = nw.y; y <= se.y; y++) out.push({ z, x, y });
  }
  return out;
}

function nearTrail(track, lat, lng, maxKm) {
  return track.some(([tlng, tlat]) => haversineKm(tlat, tlng, lat, lng) <= maxKm);
}

async function downloadTile(z, x, y) {
  const dest = path.join(outRoot, String(z), String(x), `${y}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 200) return "skip";
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const host = ["a", "b", "c"][(x + y) % 3];
  const url = `https://${host}.tile.opentopomap.org/${z}/${x}/${y}.png`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/png" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return "ok";
}

async function main() {
  const hike = JSON.parse(fs.readFileSync(hikePath, "utf8"));
  const track = hike.track;
  const wide = bboxOfTrack(track, WIDE_PAD_KM);
  const wanted = [];
  for (const z of WIDE_ZOOMS) wanted.push(...tilesInBbox(wide, z));
  for (const z of TRAIL_ZOOMS) {
    for (const t of tilesInBbox(bboxOfTrack(track, TRAIL_PAD_KM + 2), z)) {
      const c = tileCenter(t.z, t.x, t.y);
      if (nearTrail(track, c.lat, c.lng, TRAIL_PAD_KM)) wanted.push(t);
    }
  }

  console.log(`OpenTopoMap tiles: ${wanted.length}`);
  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (let i = 0; i < wanted.length; i++) {
    const { z, x, y } = wanted[i];
    try {
      const r = await downloadTile(z, x, y);
      if (r === "skip") skip += 1;
      else ok += 1;
    } catch (e) {
      fail += 1;
      console.warn(`fail ${z}/${x}/${y}: ${e.message}`);
      await sleep(800);
    }
    if ((i + 1) % 25 === 0 || i + 1 === wanted.length) {
      console.log(`  ${i + 1}/${wanted.length} ok=${ok} skip=${skip} fail=${fail}`);
    }
    if (ok > 0) await sleep(DELAY_MS);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
