import { useEffect, useMemo } from "react";
import { latLngBounds } from "leaflet";
import { useMap } from "react-leaflet";
import type { PlacesData, RouteSegment } from "@/types/trip";

/** RainViewer free tier + LibreWXR radar tiles support up to zoom 7. */
export const RADAR_MAX_ZOOM = 7;

function boundsSpan(points: [number, number][]) {
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  return {
    latSpan: Math.max(...lats) - Math.min(...lats),
    lngSpan: Math.max(...lngs) - Math.min(...lngs),
  };
}

function maxZoomForDay(points: [number, number][], radarLimited: boolean) {
  let zoom: number;
  if (points.length <= 1) zoom = 11;
  else {
    const { latSpan, lngSpan } = boundsSpan(points);
    const span = Math.max(latSpan, lngSpan);
    if (span < 0.4) zoom = 11;
    else if (span < 1.2) zoom = 10;
    else if (span < 4) zoom = 9;
    else if (span < 10) zoom = 8;
    else zoom = 7;
  }
  return radarLimited ? Math.min(zoom, RADAR_MAX_ZOOM) : zoom;
}

function clearMaxBounds(map: ReturnType<typeof useMap>) {
  map.setMaxBounds(
    latLngBounds([
      [40, -5],
      [72, 35],
    ])
  );
}

/** Initial view — entire trip with comfortable margin around waypoints. */
export function FitRouteBounds({
  places,
  enabled,
  radarLimited,
}: {
  places: PlacesData["places"];
  enabled: boolean;
  radarLimited: boolean;
}) {
  const map = useMap();

  const bounds = useMemo(() => {
    const pts = Object.values(places).map((p) => [p.lat, p.lng] as [number, number]);
    if (!pts.length) return null;
    const raw = latLngBounds(pts);
    const latSpan = raw.getNorth() - raw.getSouth();
    const lngSpan = raw.getEast() - raw.getWest();
    const latPad = latSpan * 0.14;
    const lngPad = lngSpan * 0.14;
    const southPad = latSpan * 0.22;
    return latLngBounds(
      [raw.getSouth() - southPad, raw.getWest() - lngPad],
      [raw.getNorth() + latPad, raw.getEast() + lngPad]
    );
  }, [places]);

  useEffect(() => {
    if (!enabled || !bounds) return;

    const fit = () => {
      map.invalidateSize({ animate: false });
      map.fitBounds(bounds, {
        paddingTopLeft: [48, 48],
        paddingBottomRight: [48, 96],
        maxZoom: 5,
        animate: false,
      });
      if (map.getZoom() < 4) {
        map.setView(bounds.getCenter(), 4, { animate: false });
      }
      if (radarLimited) {
        map.setMaxBounds(bounds.pad(0.15));
      } else {
        clearMaxBounds(map);
      }
    };

    fit();
    const retry1 = window.setTimeout(fit, 150);
    const retry2 = window.setTimeout(fit, 500);
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => fit());
    resizeObserver.observe(container);

    return () => {
      window.clearTimeout(retry1);
      window.clearTimeout(retry2);
      resizeObserver.disconnect();
    };
  }, [map, bounds, enabled, radarLimited]);

  return null;
}

/** Zoom map to the active day's route and stops (after user picks a day). */
export function FitDayBounds({
  segments,
  daySegments,
  day,
  places,
  selectedPlaceId,
  enabled,
  radarLimited,
}: {
  segments: RouteSegment[];
  daySegments: Record<string, string[]>;
  day: number;
  places: PlacesData["places"];
  selectedPlaceId: string;
  enabled: boolean;
  radarLimited: boolean;
}) {
  const map = useMap();
  const activeSegmentIds = useMemo(
    () => new Set(daySegments[String(day)] || []),
    [daySegments, day]
  );

  useEffect(() => {
    if (!enabled) return;

    const points: [number, number][] = [];

    for (const seg of segments) {
      if (!activeSegmentIds.has(seg.id)) continue;
      for (const [lng, lat] of seg.geometry) {
        points.push([lat, lng]);
      }
    }

    for (const seg of segments) {
      if (!activeSegmentIds.has(seg.id)) continue;
      const from = places[seg.from];
      const to = places[seg.to];
      if (from) points.push([from.lat, from.lng]);
      if (to) points.push([to.lat, to.lng]);
    }

    const selected = places[selectedPlaceId];
    if (selected) points.push([selected.lat, selected.lng]);

    if (!points.length) return;

    clearMaxBounds(map);

    const maxZoom = maxZoomForDay(points, radarLimited);

    if (points.length === 1) {
      map.setView(points[0], maxZoom, { animate: true });
      return;
    }

    map.fitBounds(points, {
      padding: [40, 40],
      maxZoom,
      animate: true,
    });
  }, [map, segments, activeSegmentIds, places, selectedPlaceId, day, enabled, radarLimited]);

  return null;
}

/**
 * Touchpad two-finger scroll passes through to the page.
 * Pinch (ctrl+wheel) zooms the map while the pointer is over it.
 */
export function MapScrollBehavior({ radarLimited }: { radarLimited: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.setMaxZoom(radarLimited ? RADAR_MAX_ZOOM : 18);
    if (!radarLimited) {
      map.setMinZoom(4);
    } else {
      map.setMinZoom(5);
    }
  }, [map, radarLimited]);

  useEffect(() => {
    map.scrollWheelZoom.disable();

    const container = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) map.zoomIn();
      else if (e.deltaY > 0) map.zoomOut();
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [map]);

  return null;
}
