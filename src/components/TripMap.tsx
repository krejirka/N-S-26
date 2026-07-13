import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import type { PlacesData, RouteSegment } from "@/types/trip";
import { makeFlagIcon } from "@/lib/flagMarker";
import RadarPrecipitationLayer from "./RadarPrecipitationLayer";
import PlacePopup from "./PlacePopup";
import "leaflet/dist/leaflet.css";

interface TripMapProps {
  segments: RouteSegment[];
  places: PlacesData["places"];
  daySegments: Record<string, string[]>;
  selectedDay: number;
  selectedPlaceId: string;
}

const outboundColor = "#c2410c";
const returnColor = "#0f766e";
const ferryColor = "#1d4ed8";
const routeOpacity = 0.5;
const activeOpacity = 1;

function FitBounds({ segments }: { segments: RouteSegment[] }) {
  const map = useMap();
  useEffect(() => {
    if (!segments.length) return;
    const all = segments.flatMap((s) => s.geometry.map(([lng, lat]) => [lat, lng] as [number, number]));
    if (all.length) map.fitBounds(all, { padding: [40, 40] });
  }, [map, segments]);
  return null;
}

export default function TripMap({
  segments,
  places,
  daySegments,
  selectedDay,
  selectedPlaceId,
}: TripMapProps) {
  const [showRadar, setShowRadar] = useState(false);

  const activeSegmentIds = useMemo(
    () => new Set(daySegments[String(selectedDay)] || []),
    [daySegments, selectedDay]
  );

  const activePlaceIds = useMemo(() => {
    const ids = new Set<string>([selectedPlaceId]);
    for (const seg of segments) {
      if (activeSegmentIds.has(seg.id)) {
        ids.add(seg.from);
        ids.add(seg.to);
      }
    }
    return ids;
  }, [segments, activeSegmentIds, selectedPlaceId]);

  const center: [number, number] = useMemo(() => {
    const p = places[selectedPlaceId];
    if (p) return [p.lat, p.lng];
    const hk = places.hradec_kralove;
    return hk ? [hk.lat, hk.lng] : [55, 12];
  }, [places, selectedPlaceId]);

  return (
    <div className="relative h-full min-h-[280px] w-full">
      <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RadarPrecipitationLayer visible={showRadar} opacity={0.5} />
        <FitBounds segments={segments} />
        {segments.map((seg) => {
          const active = activeSegmentIds.has(seg.id);
          const positions = seg.geometry.map(([lng, lat]) => [lat, lng] as [number, number]);
          const color = seg.kind === "ferry" ? ferryColor : seg.phase === "tam" ? outboundColor : returnColor;
          return (
            <Polyline
              key={seg.id}
              positions={positions}
              pathOptions={{
                color,
                weight: active ? 6 : 3,
                opacity: active ? activeOpacity : routeOpacity,
                dashArray: seg.kind === "ferry" ? "10 8" : undefined,
              }}
            />
          );
        })}
        {Object.entries(places).map(([id, place]) => {
          const active = activePlaceIds.has(id);
          const label = place.dayLabel ?? "";
          return (
            <Marker
              key={id}
              position={[place.lat, place.lng]}
              icon={makeFlagIcon(place.country, label, active)}
            >
              <PlacePopup place={place} dayLabel={label} />
            </Marker>
          );
        })}
      </MapContainer>
      <button
        type="button"
        onClick={() => setShowRadar((v) => !v)}
        className={`absolute bottom-2 left-2 z-[1000] rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow transition ${
          showRadar
            ? "bg-sky-600 text-white hover:bg-sky-700"
            : "bg-white/95 text-gray-700 hover:bg-white"
        }`}
        title="Radar srážek (RainViewer) — doplňková vrstva"
      >
        {showRadar ? "Skrýt radar srážek" : "Zobrazit radar srážek"}
      </button>
    </div>
  );
}
