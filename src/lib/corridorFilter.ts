/** Distance from point to polyline (lng/lat pairs) in km. */
export function distanceToPolylineKm(
  lat: number,
  lng: number,
  geometry: [number, number][]
): number {
  if (!geometry.length) return Infinity;
  let min = Infinity;
  for (let i = 0; i < geometry.length; i++) {
    const [lng0, lat0] = geometry[i];
    min = Math.min(min, haversineKm(lat, lng, lat0, lng0));
    if (i > 0) {
      const [lng1, lat1] = geometry[i - 1];
      min = Math.min(min, distToSegmentKm(lat, lng, lat1, lng1, lat0, lng0));
    }
  }
  return min;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distToSegmentKm(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  // Equirectangular projection locally
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
  const lat = aLat + t * (bLat - aLat);
  const lng = aLng + t * (bLng - aLng);
  return haversineKm(pLat, pLng, lat, lng);
}

/** Merge geometries of active day road segments (lng,lat). */
export function dayRouteGeometry(
  segments: { id: string; kind: string; geometry: [number, number][] }[],
  activeIds: Set<string>
): [number, number][] {
  const out: [number, number][] = [];
  for (const seg of segments) {
    if (!activeIds.has(seg.id) || seg.kind === "ferry") continue;
    for (const pt of seg.geometry) out.push(pt);
  }
  return out;
}

export function filterByCorridor<T extends { lat: number; lng: number }>(
  items: T[],
  geometry: [number, number][],
  maxKm: number
): T[] {
  if (!geometry.length) return [];
  // Sample geometry every ~5 points for speed
  const sampled = geometry.filter((_, i) => i % 5 === 0 || i === geometry.length - 1);
  return items.filter((item) => distanceToPolylineKm(item.lat, item.lng, sampled) <= maxKm);
}

/** Corridor filter + distanceKm, sorted nearest-first. */
export function rankByCorridor<T extends { lat: number; lng: number }>(
  items: T[],
  geometry: [number, number][],
  maxKm: number
): (T & { distanceKm: number })[] {
  if (!geometry.length) return [];
  const sampled = geometry.filter((_, i) => i % 5 === 0 || i === geometry.length - 1);
  return items
    .map((item) => ({
      ...item,
      distanceKm: Math.round(distanceToPolylineKm(item.lat, item.lng, sampled) * 10) / 10,
    }))
    .filter((item) => item.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export const MAX_SPEED_KMH = 110;

export function hoursAtMaxSpeed(distanceKm: number, maxKmh = MAX_SPEED_KMH): number {
  if (!distanceKm || distanceKm <= 0) return 0;
  return distanceKm / maxKmh;
}

export function formatDurationHours(hours: number): string {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
