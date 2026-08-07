import type { RouteSegment, TripDay } from "@/types/trip";

function dayRoadSegments(
  day: TripDay,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): RouteSegment[] {
  const ids = daySegments[String(day.day)] || [];
  return ids
    .map((id) => segments.find((s) => s.id === id))
    .filter((s): s is RouteSegment => !!s && s.kind === "road");
}

/** Silniční km dne z OSRM segmentů (bez trajektů). */
export function dayRoadDistanceKm(
  day: TripDay,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): number | null {
  const road = dayRoadSegments(day, segments, daySegments);
  if (!road.length) return day.km;
  return Math.round(road.reduce((sum, s) => sum + s.distanceKm, 0) * 10) / 10;
}

/**
 * Odhad jízdní doby z OSRM (sum durationHours silničních segmentů).
 * Respektuje limity a typ silnice; osobní strop 110 km/h se aplikuje zvlášť.
 */
export function dayRoadDurationHours(
  day: TripDay,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): number | null {
  const road = dayRoadSegments(day, segments, daySegments);
  if (!road.length) return null;
  let sum = 0;
  let hasDuration = false;
  for (const seg of road) {
    if (seg.durationHours != null) {
      sum += seg.durationHours;
      hasDuration = true;
    }
  }
  if (!hasDuration) return null;
  return Math.round(sum * 10) / 10;
}

export function formatDayKm(km: number | null | undefined): string | null {
  if (km == null || km <= 0) return null;
  return Number.isInteger(km) ? String(km) : km.toFixed(1).replace(/\.0$/, "");
}
