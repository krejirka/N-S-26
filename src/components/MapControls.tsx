import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import type { PlacesData, RouteSegment } from "@/types/trip";

function boundsSpan(points: [number, number][]) {
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  return {
    latSpan: Math.max(...lats) - Math.min(...lats),
    lngSpan: Math.max(...lngs) - Math.min(...lngs),
  };
}

function maxZoomForDay(points: [number, number][]) {
  if (points.length <= 1) return 9;
  const { latSpan, lngSpan } = boundsSpan(points);
  const span = Math.max(latSpan, lngSpan);
  if (span < 0.4) return 10;
  if (span < 1.2) return 8;
  if (span < 4) return 7;
  if (span < 10) return 6;
  return 5;
}

/** Zoom map to the active day's route and stops. */
export function FitDayBounds({
  segments,
  daySegments,
  day,
  places,
  selectedPlaceId,
}: {
  segments: RouteSegment[];
  daySegments: Record<string, string[]>;
  day: number;
  places: PlacesData["places"];
  selectedPlaceId: string;
}) {
  const map = useMap();
  const activeSegmentIds = useMemo(
    () => new Set(daySegments[String(day)] || []),
    [daySegments, day]
  );

  useEffect(() => {
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

    const maxZoom = maxZoomForDay(points);

    if (points.length === 1) {
      map.setView(points[0], maxZoom, { animate: true });
      return;
    }

    map.fitBounds(points, {
      padding: [36, 36],
      maxZoom,
      animate: true,
    });
  }, [map, segments, activeSegmentIds, places, selectedPlaceId, day]);

  return null;
}

/**
 * Touchpad two-finger scroll passes through to the page.
 * Pinch (ctrl+wheel) zooms the map while the pointer is over it.
 */
export function MapScrollBehavior() {
  const map = useMap();

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
