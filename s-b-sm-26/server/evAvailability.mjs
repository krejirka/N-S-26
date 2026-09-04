/**
 * TomTom nearby EV search + charging availability (shared by Vercel api/ and Vite).
 */

const EV_CATEGORY = "7309"; // Electric vehicle station
const MAX_STATIONS = 40;
const MAX_AVAIL_CALLS = 24;

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isTeslaBrand(poi) {
  const blob = `${poi.poi?.name || ""} ${(poi.poi?.brands || []).join(" ")} ${(poi.poi?.categories || []).join(" ")}`.toLowerCase();
  return blob.includes("tesla") || blob.includes("supercharger");
}

function summarizeAvailability(connectors) {
  let available = 0;
  let total = 0;
  let occupied = 0;
  let outOfService = 0;
  let unknown = 0;
  let maxPowerKW = null;
  for (const c of connectors || []) {
    total += Number(c.total) || 0;
    const cur = c.availability?.current || {};
    available += Number(cur.available) || 0;
    occupied += Number(cur.occupied) || 0;
    outOfService += Number(cur.outOfService) || 0;
    unknown += Number(cur.unknown) || 0;
    for (const p of c.availability?.perPowerLevel || []) {
      if (p.powerKW != null) maxPowerKW = Math.max(maxPowerKW ?? 0, Number(p.powerKW));
    }
  }
  return { available, total, occupied, outOfService, unknown, maxPowerKW };
}

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`TomTom ${res.status}`);
    err.status = res.status;
    err.detail = text.slice(0, 300);
    throw err;
  }
  return JSON.parse(text);
}

/**
 * @param {string} key
 * @param {{ lat: number, lng: number, radiusM?: number }} opts
 */
export async function fetchEvAvailabilityNear(key, { lat, lng, radiusM = 30000 }) {
  const searchUrl =
    `https://api.tomtom.com/search/2/nearbySearch/.json` +
    `?key=${encodeURIComponent(key)}` +
    `&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    `&radius=${encodeURIComponent(radiusM)}` +
    `&categorySet=${EV_CATEGORY}` +
    `&limit=${MAX_STATIONS}` +
    `&relatedPois=off`;

  const search = await fetchJson(searchUrl);
  const results = search.results || [];
  const stations = [];

  for (const poi of results) {
    const pos = poi.position;
    if (!pos) continue;
    const availId = poi.dataSources?.chargingAvailability?.id;
    const entry = {
      id: String(poi.id || availId || `${pos.lat},${pos.lon}`),
      name: poi.poi?.name || "Nabíjecí stanice",
      brand: (poi.poi?.brands || [])[0] || null,
      tesla: isTeslaBrand(poi),
      lat: pos.lat,
      lng: pos.lon,
      address: poi.address?.freeformAddress || null,
      chargingAvailabilityId: availId || null,
      available: null,
      total: null,
      occupied: null,
      outOfService: null,
      unknown: null,
      maxPowerKW: null,
      live: false,
      distanceM: Math.round(haversineM(lat, lng, pos.lat, pos.lon)),
    };
    stations.push(entry);
  }

  const withId = stations.filter((s) => s.chargingAvailabilityId).slice(0, MAX_AVAIL_CALLS);
  await Promise.all(
    withId.map(async (s) => {
      try {
        const url =
          `https://api.tomtom.com/search/2/chargingAvailability.json` +
          `?key=${encodeURIComponent(key)}` +
          `&chargingAvailability=${encodeURIComponent(s.chargingAvailabilityId)}`;
        const data = await fetchJson(url);
        const sum = summarizeAvailability(data.connectors);
        s.available = sum.available;
        s.total = sum.total;
        s.occupied = sum.occupied;
        s.outOfService = sum.outOfService;
        s.unknown = sum.unknown;
        s.maxPowerKW = sum.maxPowerKW;
        s.live = sum.total > 0 || (data.connectors || []).length > 0;
      } catch {
        /* keep static row */
      }
    })
  );

  stations.sort((a, b) => {
    if (a.tesla !== b.tesla) return a.tesla ? -1 : 1;
    return (a.distanceM || 0) - (b.distanceM || 0);
  });

  return {
    live: true,
    source: "tomtom",
    fetchedAt: new Date().toISOString(),
    center: { lat, lng },
    radiusM,
    stations,
  };
}

/** Match live stations onto static chargers by proximity (meters). */
export function matchLiveToChargers(chargers, stations, maxM = 180) {
  const byId = {};
  for (const c of chargers || []) {
    let best = null;
    let bestD = maxM;
    for (const s of stations || []) {
      const d = haversineM(c.lat, c.lng, s.lat, s.lng);
      if (d <= bestD) {
        bestD = d;
        best = s;
      }
    }
    if (best) byId[c.id] = { ...best, matchDistanceM: Math.round(bestD) };
  }
  return byId;
}
