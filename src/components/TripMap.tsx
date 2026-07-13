import { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import type { PlacesData, RouteSegment, TripDay } from "@/types/trip";
import type { RadarFrame } from "@/lib/rainviewer";
import { makeFlagIcon } from "@/lib/flagMarker";
import RadarPrecipitationLayer from "./RadarPrecipitationLayer";
import PlacePopup from "./PlacePopup";
import { FitDayBounds, FitRouteBounds, MapScrollBehavior, RADAR_MAX_ZOOM } from "./MapControls";
import "leaflet/dist/leaflet.css";

interface TripMapProps {
  segments: RouteSegment[];
  places: PlacesData["places"];
  daySegments: Record<string, string[]>;
  day: TripDay;
  selectedPlaceId: string;
  showRadar: boolean;
  currentFrame: RadarFrame | null;
  zoomToDay: boolean;
}

const outboundColor = "#c2410c";
const returnColor = "#0f766e";
const ferryColor = "#1d4ed8";
const routeOpacity = 0.5;
const activeOpacity = 1;

export default function TripMap({
  segments,
  places,
  daySegments,
  day,
  selectedPlaceId,
  showRadar,
  currentFrame,
  zoomToDay,
}: TripMapProps) {
  const activeSegmentIds = useMemo(
    () => new Set(daySegments[String(day.day)] || []),
    [daySegments, day.day]
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
    const hk = places.hradec_kralove;
    return hk ? [hk.lat, hk.lng] : [55, 12];
  }, [places]);

  const radarLimited = showRadar;

  return (
    <div className="relative h-full w-full min-h-0">
      <MapContainer
        center={center}
        zoom={5}
        maxZoom={radarLimited ? RADAR_MAX_ZOOM : 18}
        className="h-full w-full"
        scrollWheelZoom={false}
        touchZoom
        doubleClickZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showRadar && currentFrame && (
          <RadarPrecipitationLayer tileUrl={currentFrame.tileUrl} opacity={0.5} />
        )}
        <MapScrollBehavior radarLimited={radarLimited} />
        <FitRouteBounds segments={segments} enabled={!zoomToDay} />
        <FitDayBounds
          segments={segments}
          daySegments={daySegments}
          day={day.day}
          places={places}
          selectedPlaceId={selectedPlaceId}
          enabled={zoomToDay}
          radarLimited={radarLimited}
        />
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
    </div>
  );
}
