import { useEffect, useMemo, useState } from "react";
import type { Place, RouteSegment, TripDay } from "@/types/trip";
import { formatDurationHours, hoursAtMaxSpeed, MAX_SPEED_KMH } from "@/lib/corridorFilter";
import { dayRoadDistanceKm } from "@/lib/dayDistance";
import { apiUrl } from "@/lib/runtime";
import { useOnline } from "@/hooks/useOnline";

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
  const distanceKm = useMemo(() => dayRoadDistanceKm(day, segments, daySegments) ?? 0, [
    day,
    segments,
    daySegments,
  ]);

  const endpoints = useMemo(
    () => dayEndpoints(day, places, segments, daySegments),
    [day, places, segments, daySegments]
  );

  const baseHours = hoursAtMaxSpeed(distanceKm, MAX_SPEED_KMH);

  const [live, setLive] = useState<{
    delaySec: number;
    liveTraffic: boolean;
    trafficLengthKm: number;
    loading: boolean;
    error: string | null;
  }>({ delaySec: 0, liveTraffic: false, trafficLengthKm: 0, loading: false, error: null });

  const online = useOnline();

  useEffect(() => {
    if (!online || !endpoints || !distanceKm) {
      setLive({ delaySec: 0, liveTraffic: false, trafficLengthKm: 0, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setLive((s) => ({ ...s, loading: true, error: null }));

    const from = `${endpoints.from.lat},${endpoints.from.lng}`;
    const to = `${endpoints.to.lat},${endpoints.to.lng}`;
    const url = apiUrl(`/api/traffic?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

    fetch(url, { credentials: "omit", mode: "cors" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503 || data.liveTraffic === false) {
          return { liveTraffic: false, delaySec: 0, trafficLengthKm: 0, error: data.error || null };
        }
        if (!res.ok) {
          throw new Error(data.error || `traffic ${res.status}`);
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setLive({
          delaySec: data.delaySec || 0,
          liveTraffic: !!data.liveTraffic,
          trafficLengthKm: data.trafficLengthKm || 0,
          loading: false,
          error: data.error || null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLive({
          delaySec: 0,
          liveTraffic: false,
          trafficLengthKm: 0,
          loading: false,
          error: err.message || "traffic unavailable",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [online, endpoints?.from.lat, endpoints?.from.lng, endpoints?.to.lat, endpoints?.to.lng, distanceKm]);

  const delayHours = live.delaySec / 3600;
  const totalHours = baseHours + delayHours;

  let delayLabel: string | null = null;
  if (live.liveTraffic && live.delaySec >= 60) {
    const mins = Math.round(live.delaySec / 60);
    const jam =
      live.trafficLengthKm >= 1 ? ` · ${live.trafficLengthKm} km v koloně` : "";
    delayLabel = `+${mins} min zdržení (live)${jam}`;
  } else if (live.liveTraffic) {
    delayLabel = "bez hlášeného zdržení (live)";
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
