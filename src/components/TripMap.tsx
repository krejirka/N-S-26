import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { PlacesData, RouteSegment } from "@/types/trip";
import YrForecast from "./YrForecast";
import YrPrecipitationLayer from "./YrPrecipitationLayer";
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

function makeIcon(label: string, active: boolean) {
  const wide = label.length > 2;
  const size = wide ? 32 : 28;
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${active ? "#0f766e" : "#fff"};
      color:${active ? "#fff" : "#1b2431"};
      border:2px solid ${active ? "#0f766e" : "#94a3b8"};
      border-radius:999px;
      min-width:${size}px;height:${size}px;
      padding:0 4px;
      display:flex;align-items:center;justify-content:center;
      font-size:${wide ? "10px" : "12px"};font-weight:700;
      box-shadow:0 2px 6px rgba(0,0,0,.15);
      white-space:nowrap;
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
        <YrPrecipitationLayer />
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
            <Marker key={id} position={[place.lat, place.lng]} icon={makeIcon(label, active)}>
              <Popup minWidth={220}>
                <strong>{place.name}</strong>
                <br />
                <span className="text-xs text-gray-600">{place.country}</span>
                {label && (
                  <>
                    <br />
                    <span className="text-xs text-gray-500">Den {label}</span>
                  </>
                )}
                <YrForecast lat={place.lat} lng={place.lng} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/90 px-2 py-1 text-[10px] text-gray-600 shadow">
        Překryv srážek · yr.no nowcast
      </div>
    </div>
  );
}
