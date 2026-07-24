import { useEffect, useMemo, useState } from "react";
import type { Place, RouteSegment, TripDay } from "@/types/trip";
import { formatDurationHours, hoursAtMaxSpeed, MAX_SPEED_KMH } from "@/lib/corridorFilter";

export interface DayTravelSummary {
  distanceKm: number;
  hoursAt110: number;
  hoursLabel: string;
  liveTraffic: boolean;
  delaySec: number;
  delayLabel: string | null;
  loading: boolean;
  error: string | null;
}

function dayDistanceKm(
  day: TripDay,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): number {
  const ids = daySegments[String(day.day)] || [];
  if (!ids.length) return day.km ?? 0;
  let sum = 0;
  for (const id of ids) {
    const seg = segments.find((s) => s.id === id);
    if (seg && seg.kind === "road") sum += seg.distanceKm;
  }
  return Math.round(sum * 10) / 10 || day.km || 0;
}

function dayEndpoints(
  day: TripDay,
  places: Record<string, Place>,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): { from: Place; to: Place } | null {
  const ids = daySegments[String(day.day)] || [];
  const roadSegs = ids
    .map((id) => segments.find((s) => s.id === id))
    .filter((s): s is RouteSegment => !!s && s.kind === "road");
  if (!roadSegs.length) {
    const to = places[day.placeId];
    return to ? { from: to, to } : null;
  }
  const from = places[roadSegs[0].from];
  const to = places[roadSegs[roadSegs.length - 1].to];
  if (!from || !to) return null;
  return { from, to };
}

export function useDayTraffic(
  day: TripDay,
  places: Record<string, Place>,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): DayTravelSummary {
  const distanceKm = useMemo(
    () => dayDistanceKm(day, segments, daySegments),
    [day, segments, daySegments]
  );

  const endpoints = useMemo(
    () => dayEndpoints(day, places, segments, daySegments),
    [day, places, segments, daySegments]
  );

  const baseHours = hoursAtMaxSpeed(distanceKm, MAX_SPEED_KMH);

  const [live, setLive] = useState<{
    delaySec: number;
    liveTraffic: boolean;
    loading: boolean;
    error: string | null;
  }>({ delaySec: 0, liveTraffic: false, loading: false, error: null });

  useEffect(() => {
    if (!endpoints || !distanceKm) {
      setLive({ delaySec: 0, liveTraffic: false, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setLive((s) => ({ ...s, loading: true, error: null }));

    const from = `${endpoints.from.lat},${endpoints.from.lng}`;
    const to = `${endpoints.to.lat},${endpoints.to.lng}`;
    const url = `/api/traffic?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    fetch(url)
      .then(async (res) => {
        if (res.status === 503) {
          return { liveTraffic: false, delaySec: 0 };
        }
        if (!res.ok) throw new Error(`traffic ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setLive({
          delaySec: data.delaySec || 0,
          liveTraffic: !!data.liveTraffic,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLive({
          delaySec: 0,
          liveTraffic: false,
          loading: false,
          error: err.message || "traffic unavailable",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [endpoints?.from.lat, endpoints?.from.lng, endpoints?.to.lat, endpoints?.to.lng, distanceKm]);

  const delayHours = live.delaySec / 3600;
  const totalHours = baseHours + delayHours;

  let delayLabel: string | null = null;
  if (live.liveTraffic && live.delaySec >= 60) {
    const mins = Math.round(live.delaySec / 60);
    delayLabel = `+${mins} min zdržení (live provoz)`;
  } else if (live.liveTraffic) {
    delayLabel = "Bez hlášených komplikací";
  } else if (!live.loading) {
    delayLabel = "Live provoz nedostupný (chybí TomTom klíč)";
  }

  return {
    distanceKm,
    hoursAt110: totalHours,
    hoursLabel: formatDurationHours(totalHours),
    liveTraffic: live.liveTraffic,
    delaySec: live.delaySec,
    delayLabel,
    loading: live.loading,
    error: live.error,
  };
}
