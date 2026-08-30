/**
 * Download the marked hiking path Jastrebec → Musala from OpenStreetMap.
 * Writes src/data/hike-jastrebec-musala.json (GeoJSON-order [lng, lat] track).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const placesPath = path.join(root, "src", "data", "places.json");
const outPath = path.join(root, "src", "data", "hike-jastrebec-musala.json");

const BBOX = [42.165, 23.545, 42.245, 23.625]; // s, w, n, e
const SNAP_M = 25;
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

function keyOf(lat, lon) {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
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

function wayWeight(tags, markedBoost) {
  const hw = tags.highway || "";
  const sac = tags.sac_scale || "";
  let w = 1;
  if (hw === "track" || hw === "unclassified") w *= 1.6;
  if (hw === "steps") w *= 1.05;
  if (tags.trail_visibility === "bad" || tags.trail_visibility === "horrible") w *= 1.4;
  if (sac) w *= 0.92;
  if (tags.foot === "no") w *= 50;
  if (markedBoost) w *= markedBoost;
  return w;
}

function buildGraph(ways, markedIds, preferIds) {
  /** @type {Map<string, { lat: number, lng: number, edges: { to: string, dist: number, wayId: number }[] }>} */
  const nodes = new Map();

  const ensure = (lat, lng) => {
    const k = keyOf(lat, lng);
    if (!nodes.has(k)) nodes.set(k, { lat, lng, edges: [] });
    return k;
  };

  const link = (a, b, dist, wayId) => {
    nodes.get(a).edges.push({ to: b, dist, wayId });
    nodes.get(b).edges.push({ to: a, dist, wayId });
  };

  for (const way of ways) {
    const geom = way.geometry;
    if (!geom || geom.length < 2) continue;
    const boost = preferIds.has(way.id) ? 0.35 : markedIds.has(way.id) ? 0.55 : 1;
    const w = wayWeight(way.tags || {}, boost);
    for (let i = 1; i < geom.length; i++) {
      const a = geom[i - 1];
      const b = geom[i];
      const ka = ensure(a.lat, a.lon);
      const kb = ensure(b.lat, b.lon);
      if (ka === kb) continue;
      const dist = haversine(a.lat, a.lon, b.lat, b.lon) * w;
      link(ka, kb, dist, way.id);
    }
  }

  // Bridge tiny gaps between disconnected trail pieces
  const list = [...nodes.entries()];
  for (let i = 0; i < list.length; i++) {
    const [ka, na] = list[i];
    for (let j = i + 1; j < list.length; j++) {
      const [kb, nb] = list[j];
      const m = haversine(na.lat, na.lng, nb.lat, nb.lng) * 1000;
      if (m > 0 && m <= SNAP_M) {
        const dist = m / 1000;
        if (!na.edges.some((e) => e.to === kb)) link(ka, kb, dist, 0);
      }
    }
  }

  return nodes;
}

function nearestNode(nodes, lat, lng) {
  let best = null;
  let bestD = Infinity;
  for (const [k, n] of nodes) {
    const d = haversine(lat, lng, n.lat, n.lng);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return { key: best, distKm: bestD };
}

function dijkstra(nodes, start, end) {
  const dist = new Map();
  const prev = new Map();
  const heap = [[0, start]];
  dist.set(start, 0);

  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, u] = heap.shift();
    if (d !== dist.get(u)) continue;
    if (u === end) break;
    const node = nodes.get(u);
    if (!node) continue;
    for (const e of node.edges) {
      const nd = d + e.dist;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, u);
        heap.push([nd, e.to]);
      }
    }
  }

  if (!prev.has(end) && start !== end) return null;
  const keys = [end];
  while (keys[0] !== start) {
    const p = prev.get(keys[0]);
    if (!p) break;
    keys.unshift(p);
  }
  return keys.map((k) => {
    const n = nodes.get(k);
    return [n.lng, n.lat];
  });
}

function simplify(track, minM = 8) {
  if (track.length < 3) return track;
  const out = [track[0]];
  for (let i = 1; i < track.length - 1; i++) {
    const [lng0, lat0] = out[out.length - 1];
    const [lng1, lat1] = track[i];
    if (haversine(lat0, lng0, lat1, lng1) * 1000 >= minM) out.push(track[i]);
  }
  out.push(track[track.length - 1]);
  return out;
}

function trackKm(track) {
  let km = 0;
  for (let i = 1; i < track.length; i++) {
    km += haversine(track[i - 1][1], track[i - 1][0], track[i][1], track[i][0]);
  }
  return Math.round(km * 100) / 100;
}

async function osrmFoot(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url, { headers: { "User-Agent": "vypravy.ironknot.cz/1.0" } });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) throw new Error("OSRM empty");
  return coords;
}

const places = JSON.parse(fs.readFileSync(placesPath, "utf8")).places;
const start = places.jastrebec;
const end = places.musala;
if (!start || !end) throw new Error("Missing jastrebec/musala in places.json");

const [s, w, n, e] = BBOX;
const bb = `${s},${w},${n},${e}`;
const query = `[out:json][timeout:90];
(
  way["highway"~"^(path|footway|steps|track)$"](${bb});
  node["natural"="peak"](${bb});
  node["tourism"~"^(alpine_hut|wilderness_hut|hut)$"](${bb});
  node["amenity"="shelter"](${bb});
  node["aerialway"="station"](${bb});
  node["name"~"Musala|Мусала|Yastrebets|Jastrebec|Ястребец",i](${bb});
);
out geom tags;
(
  relation["route"="hiking"](${bb});
  relation["name"="Мусаленска Пътека"];
);
out body;`;

console.log("Overpass hiking bbox…");
const data = await overpass(query);
const elements = data.elements || [];
const ways = elements.filter((el) => el.type === "way" && el.geometry?.length);
const relations = elements.filter((el) => el.type === "relation");
const pois = [];
const seenPoi = new Set();

for (const el of elements) {
  if (el.type !== "node" || el.lat == null) continue;
  const t = el.tags || {};
  const name = t.name || t["name:en"] || t["name:bg"];
  let kind = null;
  if (t.natural === "peak") kind = "peak";
  else if (t.tourism === "alpine_hut" || t.tourism === "wilderness_hut" || t.tourism === "hut") kind = "hut";
  else if (t.amenity === "shelter") kind = "shelter";
  else if (t.aerialway === "station") kind = "station";
  if (!kind && !name) continue;
  if (!kind) kind = "poi";
  const id = `osm-${el.id}`;
  if (seenPoi.has(id)) continue;
  seenPoi.add(id);
  pois.push({
    id,
    kind,
    name: name || kind,
    lat: el.lat,
    lng: el.lon,
    ele: t.ele ? Number(t.ele) : null,
  });
}

const markedIds = new Set();
const preferIds = new Set();
for (const rel of relations) {
  const blob = `${rel.tags?.name || ""} ${rel.tags?.["name:en"] || ""}`;
  const prefer = /musala|мусал/i.test(blob);
  for (const m of rel.members || []) {
    if (m.type !== "way" || !m.ref) continue;
    markedIds.add(m.ref);
    if (prefer) preferIds.add(m.ref);
  }
}

console.log(
  `ways ${ways.length}, relations ${relations.length}, marked ${markedIds.size}, musala-rel ${preferIds.size}, pois ${pois.length}`
);

const nodes = buildGraph(ways, markedIds, preferIds);
const fromSnap = nearestNode(nodes, start.lat, start.lng);
const toSnap = nearestNode(nodes, end.lat, end.lng);
console.log(
  `snap start ${fromSnap.distKm.toFixed(3)} km, end ${toSnap.distKm.toFixed(3)} km, nodes ${nodes.size}`
);

let track = dijkstra(nodes, fromSnap.key, toSnap.key);
let source = "OpenStreetMap path/footway (Overpass)";

if (!track || track.length < 5) {
  console.log("Graph path failed, trying OSRM foot…");
  track = await osrmFoot(start, end);
  source = "OSRM foot (fallback)";
}

track = simplify(track, 8);
// Ensure endpoints are the named peaks
track.unshift([start.lng, start.lat]);
track.push([end.lng, end.lat]);
track = simplify(track, 6);

const distanceKm = trackKm(track);
if (distanceKm < 3 || distanceKm > 25) {
  console.warn(`Unexpected distance ${distanceKm} km — keeping anyway`);
}

function minDistToTrack(lat, lng, line) {
  let min = Infinity;
  for (const [tlng, tlat] of line) {
    const d = haversine(lat, lng, tlat, tlng);
    if (d < min) min = d;
  }
  return min;
}

const trailPois = pois
  .filter((p) => {
    const nearKm = p.kind === "hut" || p.kind === "shelter" ? 0.6 : 0.35;
    if (minDistToTrack(p.lat, p.lng, track) > nearKm) return false;
    if (!p.name || p.name === p.kind) return false;
    return p.kind === "peak" || p.kind === "hut" || p.kind === "shelter" || p.kind === "station";
  })
  .sort((a, b) => a.lat - b.lat);

const payload = {
  id: "jastrebec-musala",
  day: 4,
  name: "Jastrebec – Musala",
  fromPlaceId: "jastrebec",
  toPlaceId: "musala",
  placeIds: ["jastrebec_gondola", "jastrebec", "musala"],
  distanceKm,
  source,
  generatedAt: new Date().toISOString(),
  note: "Značená pěší trasa z OpenStreetMap (včetně Мусаленска пътека). Podklad: OpenTopoMap + Waymarked Trails.",
  track,
  pois: trailPois,
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote ${track.length} pts, ${distanceKm} km → ${outPath}`);
console.log(`Hiking relations: ${relations.map((r) => r.tags?.name || r.id).slice(0, 12).join(" | ")}`);
