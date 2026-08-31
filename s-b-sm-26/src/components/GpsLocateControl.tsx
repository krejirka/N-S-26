import { useEffect, useRef, useState } from "react";
import { Circle, CircleMarker, useMap } from "react-leaflet";
import type { ErrorEvent, LocationEvent } from "leaflet";
import { haversineKm } from "@/lib/corridorFilter";

interface GpsLocateControlProps {
  enabled: boolean;
  trailLatLngs?: [number, number][];
  onStatus?: (status: string | null) => void;
}

export default function GpsLocateControl({ enabled, trailLatLngs, onStatus }: GpsLocateControlProps) {
  const map = useMap();
  const [pos, setPos] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const panned = useRef(false);
  const trailRef = useRef(trailLatLngs);
  trailRef.current = trailLatLngs;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  useEffect(() => {
    if (!enabled) {
      map.stopLocate();
      setPos(null);
      panned.current = false;
      onStatusRef.current?.(null);
      return;
    }

    const onFound = (e: LocationEvent) => {
      setPos({ lat: e.latlng.lat, lng: e.latlng.lng, acc: e.accuracy });
      onStatusRef.current?.(null);
      if (panned.current) return;
      const trail = trailRef.current;
      const near =
        !trail?.length ||
        trail.some(([lat, lng]) => haversineKm(e.latlng.lat, e.latlng.lng, lat, lng) < 20);
      if (near) {
        map.setView(e.latlng, Math.max(map.getZoom(), 14), { animate: true });
      }
      panned.current = true;
    };

    const onError = (e: ErrorEvent) => {
      onStatusRef.current?.(e.message || "GPS není dostupné");
    };

    map.on("locationfound", onFound);
    map.on("locationerror", onError);
    const hiking = Boolean(trailRef.current?.length);
    map.locate({
      watch: true,
      enableHighAccuracy: hiking,
      setView: false,
      maxZoom: 16,
      maximumAge: hiking ? 3000 : 15000,
      timeout: 20000,
    });

    return () => {
      map.off("locationfound", onFound);
      map.off("locationerror", onError);
      map.stopLocate();
    };
  }, [enabled, map]);

  if (!enabled || !pos) return null;

  return (
    <>
      <Circle
        center={[pos.lat, pos.lng]}
        radius={Math.max(pos.acc, 12)}
        pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.12 }}
        interactive={false}
      />
      <CircleMarker
        center={[pos.lat, pos.lng]}
        radius={7}
        pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
        interactive={false}
      />
    </>
  );
}