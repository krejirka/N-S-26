/**
 * Build offline map packs for the Android APK:
 *  - corridor.pmtiles: Protomaps vector basemap, 100 km around the planned route (z0–12)
 *  - streets.pmtiles: street-level detail ~12 km from the route (z13–15) for city navigation
 *  - hike.pmtiles: higher-detail cutout around Jastrebec–Musala (z0–16)
 *  - otm/{z}/{x}/{y}.png: OpenTopoMap raster for the trek (high zoom)
 *
 * OSM raster bulk download is avoided (tile ToS). Vector cutouts use pmtiles extract
 * (HTTP range requests against the public Protomaps planet archive).
 */
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "offline-maps");
const toolsDir = path.join(root, "tools", "pmtiles-bin");
const routesPath = path.join(root, "src", "data", "routes.json");
const hikePath = path.join(root, "src", "data", "hike-jastrebec-musala.json");

const PLANET =
  process.env.PROTOMAPS_URL || "https://build.protomaps.com/20260830.pmtiles";
const CORRIDOR_KM = 100;
const STREET_KM = Number(process.env.STREET_KM || 12);
const SAMPLE_KM = 12;
const CORRIDOR_MAXZOOM = Number(process.env.CORRIDOR_MAXZOOM || 12);
const STREET_MINZOOM = Number(process.env.STREET_MINZOOM || 13);
const STREET_MAXZOOM = Number(process.env.STREET_MAXZOOM || 14);
const HIKE_MAXZOOM = Number(process.env.HIKE_MAXZOOM || 16);
const HIKE_PAD_KM = Number(process.env.HIKE_PAD_KM || 15);

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function destination(lat, lon, bearingDeg, distKm) {
  const R = 6371;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distKm / R) + Math.cos(lat1) * Math.sin(distKm / R) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distKm / R) * Math.cos(lat1),
      Math.cos(distKm / R) - Math.sin(lat1) * Math.sin(lat2)
    );
  return [(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
}

function circleRing(lat, lon, radiusKm, steps = 24) {
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    ring.push(destination(lat, lon, (360 * i) / steps, radiusKm));
  }
  return ring;
}

function sampleRoutePoints(segments, stepKm) {
  const out = [];
  let last = null;
  for (const seg of segments) {
    const geom = seg.geometry;
    if (!geom?.length) continue;
    for (const [lng, lat] of geom) {
      if (!last) {
        out.push([lat, lng]);
        last = [lat, lng];
        continue;
      }
      if (haversineKm(last[0], last[1], lat, lng) >= stepKm) {
        out.push([lat, lng]);
        last = [lat, lng];
      }
    }
  }
  return out;
}

function findPmtilesBin() {
  const exe = path.join(toolsDir, "pmtiles.exe");
  if (fs.existsSync(exe)) return exe;
  const plain = path.join(toolsDir, "pmtiles");
  if (fs.existsSync(plain)) return plain;
  throw new Error(`pmtiles CLI not found in ${toolsDir}`);
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    console.log(`$ ${path.basename(bin)} ${args.join(" ")}`);
    const child = spawn(bin, args, { stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(bin)} exited ${code}`));
    });
  });
}

function writeRegion(points, radiusKm, fileName) {
  const features = points.map(([lat, lng], i) => ({
    type: "Feature",
    properties: { i },
    geometry: {
      type: "Polygon",
      coordinates: [circleRing(lat, lng, radiusKm)],
    },
  }));
  const geojson = { type: "FeatureCollection", features };
  const file = path.join(outDir, fileName);
  fs.writeFileSync(file, JSON.stringify(geojson));
  return file;
}

function hikeBbox(track) {
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
  const dLat = HIKE_PAD_KM / 111.32;
  const midLat = (minLat + maxLat) / 2;
  const dLon = HIKE_PAD_KM / (111.32 * Math.cos((midLat * Math.PI) / 180));
  return {
    minLon: minLon - dLon,
    minLat: minLat - dLat,
    maxLon: maxLon + dLon,
    maxLat: maxLat + dLat,
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const routes = JSON.parse(fs.readFileSync(routesPath, "utf8"));
  const hike = JSON.parse(fs.readFileSync(hikePath, "utf8"));
  const points = sampleRoutePoints(routes.segments, SAMPLE_KM);
  console.log(`Route samples: ${points.length} (every ~${SAMPLE_KM} km)`);

  const corridorRegion = writeRegion(points, CORRIDOR_KM, "corridor-100km.geojson");
  const streetRegion = writeRegion(points, STREET_KM, "streets-12km.geojson");
  const bin = findPmtilesBin();
  const corridorOut = path.join(outDir, "corridor.pmtiles");
  const streetsOut = path.join(outDir, "streets.pmtiles");
  const hikeOut = path.join(outDir, "hike.pmtiles");
  const bbox = hikeBbox(hike.track);

  const dry = process.argv.includes("--dry-run");
  const skipCorridor = process.argv.includes("--skip-corridor");
  const extra = dry ? ["--dry-run"] : [];

  if (!skipCorridor) {
    await run(bin, [
      "extract",
      PLANET,
      corridorOut,
      `--region=${corridorRegion}`,
      `--maxzoom=${CORRIDOR_MAXZOOM}`,
      "--download-threads=4",
      ...extra,
    ]);
  }

  await run(bin, [
    "extract",
    PLANET,
    streetsOut,
    `--region=${streetRegion}`,
    `--minzoom=${STREET_MINZOOM}`,
    `--maxzoom=${STREET_MAXZOOM}`,
    "--download-threads=6",
    ...extra,
  ]);

  await run(bin, [
    "extract",
    PLANET,
    hikeOut,
    `--bbox=${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`,
    `--maxzoom=${HIKE_MAXZOOM}`,
    "--download-threads=4",
    ...extra,
  ]);

  // One continuous archive for the APK (z0–14). Stacked corridor+streets
  // GridLayers blanked the overview with empty opaque tiles.
  const basemapOut = path.join(outDir, "basemap.pmtiles");
  if (!dry && fs.existsSync(corridorOut) && fs.existsSync(streetsOut)) {
    await run(bin, ["merge", corridorOut, streetsOut, basemapOut]);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    planet: PLANET,
    basemap: "basemap.pmtiles",
    corridorKm: CORRIDOR_KM,
    corridorMaxZoom: CORRIDOR_MAXZOOM,
    streetKm: STREET_KM,
    streetMinZoom: STREET_MINZOOM,
    streetMaxZoom: STREET_MAXZOOM,
    hikeMaxZoom: HIKE_MAXZOOM,
    hikePadKm: HIKE_PAD_KM,
    hikeBbox: bbox,
    samples: points.length,
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Wrote", path.join(outDir, "manifest.json"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
