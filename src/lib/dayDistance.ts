import type { RouteSegment, TripDay } from "@/types/trip";

/** Silniční km dne z OSRM segmentů (bez trajektů). */
export function dayRoadDistanceKm(
  day: TripDay,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): number | null {
  const ids = daySegments[String(day.day)] || [];
  if (!ids.length) return day.km;

  let sum = 0;
  let hasRoad = false;
  for (const id of ids) {
    const seg = segments.find((s) => s.id === id);
    if (seg?.kind === "road") {
      sum += seg.distanceKm;
      hasRoad = true;
    }
  }
  if (!hasRoad) return day.km;
  return Math.round(sum * 10) / 10;
}

export function formatDayKm(km: number | null | undefined): string | null {
  if (km == null || km <= 0) return null;
  return Number.isInteger(km) ? String(km) : km.toFixed(1).replace(/\.0$/, "");
}
