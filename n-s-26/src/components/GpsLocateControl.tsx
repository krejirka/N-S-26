import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Circle, Marker, useMap } from "react-leaflet";
import type { ErrorEvent, LocationEvent } from "leaflet";
import { haversineKm } from "@/lib/corridorFilter";

const gpsIcon = L.divIcon({
  className: "gps-user-marker",
  html: `<div class="gps-dot" aria-hidden="true"><span class="gps-dot-pulse"></span><span class="gps-dot-core"></span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

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
      const nearTrail =
        Boolean(trail?.length) &&
        trail!.some(([lat, lng]) => haversineKm(e.latlng.lat, e.latlng.lng, lat, lng) < 20);
      if (nearTrail) {
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

  const accRadius = useMemo(() => {
    if (!pos) return 0;
    return Math.min(Math.max(pos.acc, 16), 70);
  }, [pos]);

  if (!enabled || !pos) return null;

  return (
    <>
      <Circle
        center={[pos.lat, pos.lng]}
        radius={accRadius}
        pathOptions={{
          color: "#1a73e8",
          weight: 1,
          opacity: 0.28,
          fillColor: "#1a73e8",
          fillOpacity: 0.1,
        }}
        interactive={false}
      />
      <Marker
        position={[pos.lat, pos.lng]}
        icon={gpsIcon}
        zIndexOffset={1200}
        interactive={false}
      />
    </>
  );
}
