import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { PlacesData, RouteSegment } from "@/types/trip";
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
const dimOpacity = 0.2;

function FitBounds({ segments }: { segments: RouteSegment[] }) {
  const map = useMap();
  useEffect(() => {
    if (!segments.length) return;
    const all = segments.flatMap((s) => s.geometry.map(([lng, lat]) => [lat, lng] as [number, number]));
    if (all.length) map.fitBounds(all, { padding: [40, 40] });
  }, [map, segments]);
  return null;
}

function makeIcon(label: string, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${active ? "#0f766e" : "#fff"};
      color:${active ? "#fff" : "#1b2431"};
      border:2px solid ${active ? "#0f766e" : "#94a3b8"};
      border-radius:999px;
      min-width:26px;height:26px;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;
      box-shadow:0 2px 6px rgba(0,0,0,.15);
    ">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function TripMap({
  segments,
  places,
  daySegments,
  selectedDay,
  selectedPlaceId,
}: TripMapProps) {
  const activeSegmentIds = useMemo(
    () => new Set(daySegments[String(selectedDay)] || []),
    [daySegments, selectedDay]
  );

  const center: [number, number] = useMemo(() => {
    const p = places[selectedPlaceId];
    if (p) return [p.lat, p.lng];
    const hk = places.hradec_kralove;
    return hk ? [hk.lat, hk.lng] : [55, 12];
  }, [places, selectedPlaceId]);

  return (
    <div className="h-full min-h-[280px] w-full">
      <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
                weight: active ? 5 : 3,
                opacity: active ? 1 : dimOpacity,
                dashArray: seg.kind === "ferry" ? "10 8" : undefined,
              }}
            />
          );
        })}
        {Object.entries(places).map(([id, place]) => {
          const active = id === selectedPlaceId;
          return (
            <Marker key={id} position={[place.lat, place.lng]} icon={makeIcon("", active)}>
              <Popup>
                <strong>{place.name}</strong>
                <br />
                <span className="text-xs text-gray-600">{place.country}</span>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
