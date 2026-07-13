import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { RouteSegment } from "@/types/trip";

/** Tighter fit on the route — more zoom, less empty margin. */
export function FitRouteBounds({ segments }: { segments: RouteSegment[] }) {
  const map = useMap();

  useEffect(() => {
    if (!segments.length) return;
    const all = segments.flatMap((s) => s.geometry.map(([lng, lat]) => [lat, lng] as [number, number]));
    if (!all.length) return;

    map.fitBounds(all, {
      padding: [20, 20],
      maxZoom: 6,
    });
  }, [map, segments]);

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
