import { useEffect, useMemo, useRef } from "react";
import { latLngBounds } from "leaflet";
import { useMap, useMapEvents } from "react-leaflet";
import type { PlacesData, RouteSegment } from "@/types/trip";
import { MAP_MAX_BOUNDS } from "@/tripMeta";

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

function maxZoomForDay(points: [number, number][], radarLimited: boolean, hikeView: boolean) {
  if (hikeView) return 14;
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
  map.setMaxBounds(latLngBounds(MAP_MAX_BOUNDS));
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
    return latLngBounds(pts);
  }, [places]);

  useEffect(() => {
    if (!enabled || !bounds) return;

    const fit = () => {
      map.invalidateSize({ animate: false });
      // fitBounds centers in projected (pixel) space, which is the only
      // correct way for a route spanning 50°N–67°N — never override it
      // with setView(bounds.getCenter()) (arithmetic center sits too far
      // south in Mercator and clips the north end of the route).
      map.fitBounds(bounds, {
        padding: [12, 12],
        maxZoom: radarLimited ? RADAR_MAX_ZOOM : 18,
        animate: false,
      });
      // Never open zoomed-out to all of Europe: hold zoom 5 (route fills
      // the frame); keep the pixel-space center fitBounds just computed.
      if (map.getZoom() < 5) {
        map.setZoom(5, { animate: false });
      }
      if (radarLimited) {
        // Generous pad so maxBounds never shifts the freshly fitted view.
        map.setMaxBounds(bounds.pad(0.5));
      } else {
        clearMaxBounds(map);
      }
    };

    fit();
    const retry = window.setTimeout(fit, 200);
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => fit());
    resizeObserver.observe(container);

    return () => {
      window.clearTimeout(retry);
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
  fitNonce = 0,
  extraPoints,
  hikeView = false,
}: {
  segments: RouteSegment[];
  daySegments: Record<string, string[]>;
  day: number;
  places: PlacesData["places"];
  selectedPlaceId: string;
  enabled: boolean;
  radarLimited: boolean;
  /** Bump to force re-fit (e.g. after re-enabling radar). */
  fitNonce?: number;
  extraPoints?: [number, number][];
  hikeView?: boolean;
}) {
  const map = useMap();
  const activeSegmentIds = useMemo(
    () => new Set(daySegments[String(day)] || []),
    [daySegments, day]
  );
  const radarLimitedRef = useRef(radarLimited);
  radarLimitedRef.current = radarLimited;

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
    if (extraPoints?.length) points.push(...extraPoints);

    if (!points.length) return;

    clearMaxBounds(map);

    const maxZoom = maxZoomForDay(points, radarLimitedRef.current, hikeView);

    if (points.length === 1) {
      map.setView(points[0], maxZoom, { animate: true });
      return;
    }

    map.fitBounds(points, {
      padding: [40, 40],
      maxZoom,
      animate: true,
    });
    // Intentionally omit radarLimited from deps: auto-disabling radar on zoom-in
    // must not snap the view back to day bounds.
  }, [map, segments, activeSegmentIds, places, selectedPlaceId, day, enabled, fitNonce, extraPoints, hikeView]);

  return null;
}

/**
 * Touchpad two-finger scroll passes through to the page.
 * Pinch (ctrl+wheel) zooms the map while the pointer is over it.
 * Max zoom is never locked by radar — zooming past RADAR_MAX_ZOOM auto-disables radar elsewhere.
 */
export function MapScrollBehavior() {
  const map = useMap();

  useEffect(() => {
    map.setMaxZoom(18);
    map.setMinZoom(4);
  }, [map]);

  // Recalculate tiles when the map container is revealed or resized
  // (e.g. switching mobile tabs shows a previously display:none map).
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

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

/** After CSS/native fullscreen, Leaflet must recompute tile viewport. */
export function MapInvalidateSize({ nonce }: { nonce: number }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize({ animate: false }), 60);
    return () => window.clearTimeout(id);
  }, [map, nonce]);
  return null;
}

/** When user zooms past radar tile limit, turn radar off so further zoom works. */
export function RadarAutoDisable({
  showRadar,
  onDisable,
}: {
  showRadar: boolean;
  onDisable: () => void;
}) {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      if (!showRadar) return;
      if (map.getZoom() > RADAR_MAX_ZOOM) onDisable();
    },
  });

  return null;
}
