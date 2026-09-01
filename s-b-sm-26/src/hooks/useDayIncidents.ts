import { useEffect, useMemo, useState } from "react";
import type { RouteSegment, TripDay } from "@/types/trip";
import { dayRouteGeometry } from "@/lib/corridorFilter";
import { apiUrl } from "@/lib/runtime";
import { useOnline } from "@/hooks/useOnline";

export interface TrafficIncident {
  id: string;
  lat: number;
  lng: number;
  category: number;
  categoryLabel: string;
  description: string;
  from: string | null;
  to: string | null;
  roadNumbers: string[];
  delaySec: number;
  lengthM: number;
  magnitudeOfDelay: number | null;
}

export interface DayIncidentsSummary {
  incidents: TrafficIncident[];
  roadworksCount: number;
  closedCount: number;
  accidentCount: number;
  liveIncidents: boolean;
  loading: boolean;
  error: string | null;
}

/** Sample route geometry for the incidents API (lng,lat pairs). */
function samplePath(geometry: [number, number][], maxPoints = 36): [number, number][] {
  if (geometry.length <= maxPoints) return geometry;
  const step = Math.ceil(geometry.length / maxPoints);
  const out: [number, number][] = [];
  for (let i = 0; i < geometry.length; i += step) out.push(geometry[i]);
  const last = geometry[geometry.length - 1];
  if (out[out.length - 1][0] !== last[0] || out[out.length - 1][1] !== last[1]) {
    out.push(last);
  }
  return out;
}

export function useDayIncidents(
  day: TripDay,
  segments: RouteSegment[],
  daySegments: Record<string, string[]>
): DayIncidentsSummary {
  const pathKey = useMemo(() => {
    const ids = new Set(daySegments[String(day.day)] || []);
    const geom = dayRouteGeometry(segments, ids);
    const sampled = samplePath(geom);
    if (sampled.length < 2) return null;
    return sampled.map(([lng, lat]) => `${lng.toFixed(4)},${lat.toFixed(4)}`).join(";");
  }, [day.day, segments, daySegments]);

  const online = useOnline();

  const [state, setState] = useState<DayIncidentsSummary>({
    incidents: [],
    roadworksCount: 0,
    closedCount: 0,
    accidentCount: 0,
    liveIncidents: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!online || !pathKey) {
      setState({
        incidents: [],
        roadworksCount: 0,
        closedCount: 0,
        accidentCount: 0,
        liveIncidents: false,
        loading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(apiUrl(`/api/incidents?path=${encodeURIComponent(pathKey)}`), {
      credentials: "omit",
      mode: "cors",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503 || data.liveIncidents === false) {
          return {
            liveIncidents: false,
            incidents: [],
            roadworksCount: 0,
            closedCount: 0,
            accidentCount: 0,
            error: data.error || null,
          };
        }
        if (!res.ok) throw new Error(data.error || `incidents ${res.status}`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setState({
          incidents: data.incidents || [],
          roadworksCount: data.roadworksCount || 0,
          closedCount: data.closedCount || 0,
          accidentCount: data.accidentCount || 0,
          liveIncidents: !!data.liveIncidents,
          loading: false,
          error: data.error || data.partialError || null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          incidents: [],
          roadworksCount: 0,
          closedCount: 0,
          accidentCount: 0,
          liveIncidents: false,
          loading: false,
          error: err.message || "incidents unavailable",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [online, pathKey]);

  return state;
}
