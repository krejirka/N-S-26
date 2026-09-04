import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/runtime";
import { useOnline } from "@/hooks/useOnline";
import type { EvCharger, EvLiveStatus } from "@/types/trip";

interface LiveStation {
  id: string;
  name: string;
  brand?: string | null;
  tesla?: boolean;
  lat: number;
  lng: number;
  available: number | null;
  total: number | null;
  occupied?: number | null;
  maxPowerKW?: number | null;
  live: boolean;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchById(chargers: EvCharger[], stations: LiveStation[], maxM = 180): Record<string, EvLiveStatus> {
  const out: Record<string, EvLiveStatus> = {};
  for (const c of chargers) {
    let best: LiveStation | null = null;
    let bestD = maxM;
    for (const s of stations) {
      const d = haversineM(c.lat, c.lng, s.lat, s.lng);
      if (d <= bestD) {
        bestD = d;
        best = s;
      }
    }
    if (!best) continue;
    out[c.id] = {
      available: best.available,
      total: best.total,
      occupied: best.occupied ?? null,
      maxPowerKW: best.maxPowerKW ?? null,
      live: Boolean(best.live),
      tesla: best.tesla,
      name: best.name,
    };
  }
  return out;
}

/**
 * Live EV availability near a point (TomTom via /api/ev-availability).
 * Matched onto static corridor chargers by proximity.
 */
export function useEvAvailability(
  chargers: EvCharger[],
  center: { lat: number; lng: number } | null,
  opts?: { radiusM?: number; enabled?: boolean }
): {
  byId: Record<string, EvLiveStatus>;
  live: boolean;
  loading: boolean;
  fetchedAt: string | null;
} {
  const online = useOnline();
  const enabled = opts?.enabled !== false && online && Boolean(center);
  const radiusM = opts?.radiusM ?? 30000;
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !center) {
      setStations([]);
      setLive(false);
      setFetchedAt(null);
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const url =
          `${apiUrl("/api/ev-availability")}` +
          `?lat=${encodeURIComponent(center.lat)}` +
          `&lng=${encodeURIComponent(center.lng)}` +
          `&radius=${encodeURIComponent(radiusM)}`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        if (cancelled) return;
        setLive(Boolean(data.live));
        setFetchedAt(data.fetchedAt || null);
        setStations(Array.isArray(data.stations) ? data.stations : []);
      } catch {
        if (!cancelled) {
          setLive(false);
          setStations([]);
          setFetchedAt(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    const id = window.setInterval(run, 3 * 60_000);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [enabled, center?.lat, center?.lng, radiusM]);

  const byId = useMemo(() => matchById(chargers, stations), [chargers, stations]);

  return { byId, live, loading, fetchedAt };
}
