/** Shared TomTom Incident Details along a path (used by api/ + Vite middleware). */

const FIELDS =
  "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},from,to,length,delay,roadNumbers}}}";

/** Road works, lane/road closed, accidents — not plain jams. */
const CATEGORY_FILTER = "9,7,8,1";

const CATEGORY_LABEL = {
  1: "Nehoda",
  7: "Uzavřený pruh",
  8: "Uzavírka",
  9: "Stavební práce",
};

const CORRIDOR_KM = 5;
const MAX_BOXES = 10;
const MAX_INCIDENTS = 45;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distToSegmentKm(pLat, pLng, aLat, aLng, bLat, bLng) {
  const x = ((pLng - aLng) * Math.PI) / 180;
  const y = ((pLat - aLat) * Math.PI) / 180;
  const dx = ((bLng - aLng) * Math.PI) / 180;
  const dy = ((bLat - aLat) * Math.PI) / 180;
  const cos = Math.cos((aLat * Math.PI) / 180);
  const xx = x * cos;
  const dxx = dx * cos;
  const len2 = dxx * dxx + dy * dy;
  let t = len2 === 0 ? 0 : (xx * dxx + y * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return haversineKm(pLat, pLng, aLat + t * (bLat - aLat), aLng + t * (bLng - aLng));
}

function approxAreaKm2(minLon, minLat, maxLon, maxLat) {
  const midLat = (minLat + maxLat) / 2;
  const h = (maxLat - minLat) * 111;
  const w = (maxLon - minLon) * 111 * Math.cos((midLat * Math.PI) / 180);
  return Math.abs(h * w);
}

/** Parse `lng,lat;lng,lat;...` → [[lng,lat], ...] */
export function parsePathParam(path) {
  if (!path || typeof path !== "string") return [];
  return path
    .split(";")
    .map((pair) => {
      const [a, b] = pair.split(",").map(Number);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
      return [a, b];
    })
    .filter(Boolean);
}

/** Sliding bboxes along path, each under ~8 000 km² (TomTom limit 10 000). */
export function bboxesAlongPath(points, padDeg = 0.12) {
  if (!points.length) return [];
  const boxes = [];
  let i = 0;
  while (i < points.length && boxes.length < MAX_BOXES) {
    let minLng = points[i][0];
    let maxLng = points[i][0];
    let minLat = points[i][1];
    let maxLat = points[i][1];
    let j = i + 1;
    while (j < points.length) {
      const [lng, lat] = points[j];
      const nMinLng = Math.min(minLng, lng);
      const nMaxLng = Math.max(maxLng, lng);
      const nMinLat = Math.min(minLat, lat);
      const nMaxLat = Math.max(maxLat, lat);
      const area = approxAreaKm2(
        nMinLng - padDeg,
        nMinLat - padDeg,
        nMaxLng + padDeg,
        nMaxLat + padDeg
      );
      if (area > 8000) break;
      minLng = nMinLng;
      maxLng = nMaxLng;
      minLat = nMinLat;
      maxLat = nMaxLat;
      j++;
    }
    boxes.push(
      [
        (minLng - padDeg).toFixed(5),
        (minLat - padDeg).toFixed(5),
        (maxLng + padDeg).toFixed(5),
        (maxLat + padDeg).toFixed(5),
      ].join(",")
    );
    if (j >= points.length) break;
    i = Math.max(i + 1, j - 1);
  }
  return boxes;
}

function incidentPoint(geometry) {
  if (!geometry?.coordinates) return null;
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (geometry.type === "LineString" && geometry.coordinates.length) {
    const mid = geometry.coordinates[Math.floor(geometry.coordinates.length / 2)];
    const [lng, lat] = mid;
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
}

function minDistToPathKm(lat, lng, path) {
  let min = Infinity;
  for (let i = 0; i < path.length; i++) {
    const [lng0, lat0] = path[i];
    min = Math.min(min, haversineKm(lat, lng, lat0, lng0));
    if (i > 0) {
      const [lng1, lat1] = path[i - 1];
      min = Math.min(min, distToSegmentKm(lat, lng, lat1, lng1, lat0, lng0));
    }
  }
  return min;
}

/** Prefer motorway / trunk style road numbers (A13, D8, E55, …). */
function isMajorRoad(roadNumbers) {
  if (!roadNumbers?.length) return false;
  return roadNumbers.some((r) => /^(A|D|E|S|I|M)\d/i.test(String(r).trim()));
}

async function fetchBbox(key, bbox, language) {
  const url =
    `https://api.tomtom.com/traffic/services/5/incidentDetails` +
    `?key=${encodeURIComponent(key)}` +
    `&bbox=${encodeURIComponent(bbox)}` +
    `&fields=${encodeURIComponent(FIELDS)}` +
    `&language=${encodeURIComponent(language)}` +
    `&categoryFilter=${CATEGORY_FILTER}` +
    `&timeValidityFilter=present`;

  const res = await fetch(url);
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    return { ok: false, status: res.status, detail, incidents: [] };
  }
  const data = await res.json();
  return { ok: true, incidents: data.incidents || [] };
}

/**
 * @param {string} key
 * @param {[number, number][]} pathLngLat
 * @param {{ language?: string }} [opts]
 */
export async function fetchIncidentsAlongPath(key, pathLngLat, opts = {}) {
  const language = opts.language || "cs-CZ";
  if (!pathLngLat.length) {
    return { liveIncidents: true, incidents: [], roadworksCount: 0 };
  }

  const boxes = bboxesAlongPath(pathLngLat);
  const results = await Promise.all(boxes.map((bbox) => fetchBbox(key, bbox, language)));

  const byId = new Map();
  for (const r of results) {
    for (const feat of r.incidents) {
      const props = feat.properties || {};
      const id = props.id || `${props.iconCategory}-${props.from}-${props.to}`;
      if (byId.has(id)) continue;
      const pt = incidentPoint(feat.geometry);
      if (!pt) continue;
      if (minDistToPathKm(pt.lat, pt.lng, pathLngLat) > CORRIDOR_KM) continue;
      const cat = props.iconCategory;
      const event = props.events?.[0];
      byId.set(id, {
        id,
        lat: pt.lat,
        lng: pt.lng,
        category: cat,
        categoryLabel: CATEGORY_LABEL[cat] || "Incident",
        description: event?.description || CATEGORY_LABEL[cat] || "Incident",
        from: props.from || null,
        to: props.to || null,
        roadNumbers: props.roadNumbers || [],
        delaySec: props.delay || 0,
        lengthM: props.length || 0,
        magnitudeOfDelay: props.magnitudeOfDelay ?? null,
      });
    }
  }

  const scored = [...byId.values()].map((inc) => {
    const major = isMajorRoad(inc.roadNumbers);
    const longish = (inc.lengthM || 0) >= 400;
    const delayed = (inc.delaySec || 0) >= 60;
    let keep = false;
    if (inc.category === 9) {
      keep = major || longish || delayed || (inc.magnitudeOfDelay ?? 0) >= 2;
    } else {
      // Closures / accidents: only if on a major road or causing delay
      keep = major || delayed;
    }
    const score =
      (inc.category === 9 ? 100 : inc.category === 8 || inc.category === 7 ? 70 : 50) +
      (major ? 40 : 0) +
      (delayed ? 20 : 0) +
      Math.min(30, Math.round((inc.lengthM || 0) / 200));
    return { inc, keep, score };
  });

  const incidents = scored
    .filter((s) => s.keep)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_INCIDENTS)
    .map((s) => s.inc);

  const roadworksCount = incidents.filter((i) => i.category === 9).length;
  const failed = results.filter((r) => !r.ok);
  return {
    liveIncidents: true,
    incidents,
    roadworksCount,
    closedCount: incidents.filter((i) => i.category === 8 || i.category === 7).length,
    accidentCount: incidents.filter((i) => i.category === 1).length,
    boxesQueried: boxes.length,
    ...(failed.length
      ? { partialError: failed.map((f) => `${f.status}: ${f.detail}`).join("; ") }
      : {}),
  };
}
