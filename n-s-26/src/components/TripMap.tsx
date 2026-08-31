import { useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import type {
  BorderCrossingAlt,
  CorridorPoi,
  FishingSpot,
  LodgingPoi,
  PlacesData,
  RouteSegment,
  ShopPoi,
  TripDay,
} from "@/types/trip";
import type { RadarFrame } from "@/lib/rainviewer";
import type { RadarPlayMode } from "@/hooks/useRadarAnimation";
import { makeFlagIcon } from "@/lib/flagMarker";
import { makeFerryIcon } from "@/lib/ferryMarker";
import RadarPrecipitationLayer from "./RadarPrecipitationLayer";
import RadarTimeline from "./RadarTimeline";
import PlacePopup from "./PlacePopup";
import LodgingMarkers from "./LodgingMarkers";
import CorridorPoiMarkers from "./CorridorPoiMarkers";
import FishingSpotMarkers from "./FishingSpotMarkers";
import TrafficIncidentMarkers from "./TrafficIncidentMarkers";
import BorderCrossingMarkers from "./BorderCrossingMarkers";
import type { TrafficIncident } from "@/hooks/useDayIncidents";
import { hoverPopupHandlers } from "@/lib/hoverPopup";
import { MAP_POI_LAYERS_OFF, type MapPoiLayer } from "@/lib/mapPoiLayers";
import MapPoiLayerToggles from "./MapPoiLayerToggles";
import {
  FitDayBounds,
  FitRouteBounds,
  MapInvalidateSize,
  MapScrollBehavior,
  RadarAutoDisable,
} from "./MapControls";
import { useMapFullscreen } from "@/hooks/useMapFullscreen";
import "leaflet/dist/leaflet.css";

interface TripMapProps {
  segments: RouteSegment[];
  places: PlacesData["places"];
  daySegments: Record<string, string[]>;
  day: TripDay;
  selectedPlaceId: string;
  shops: ShopPoi[];
  lodgings: LodgingPoi[];
  corridorPois: CorridorPoi[];
  fishingSpots: FishingSpot[];
  borderCrossings?: BorderCrossingAlt[];
  trafficIncidents?: TrafficIncident[];
  showRadar: boolean;
  currentFrame: RadarFrame | null;
  zoomToDay: boolean;
  frames: RadarFrame[];
  currentIndex: number;
  referenceTime: number;
  isPlaying: boolean;
  playMode: RadarPlayMode;
  radarLoading: boolean;
  hasForecast: boolean;
  onPlayHistory: () => void;
  onPlayForecast: () => void;
  onToggleRadar: () => void;
  onRadarAutoDisable?: () => void;
  fitNonce?: number;
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
  shops,
  lodgings,
  corridorPois,
  fishingSpots,
  borderCrossings = [],
  trafficIncidents = [],
  showRadar,
  currentFrame,
  zoomToDay,
  frames,
  currentIndex,
  referenceTime,
  isPlaying,
  playMode,
  radarLoading,
  hasForecast,
  onPlayHistory,
  onPlayForecast,
  onToggleRadar,
  onRadarAutoDisable,
  fitNonce = 0,
}: TripMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { fullscreen, toggle: toggleFullscreen } = useMapFullscreen(wrapRef);
  const activeSegmentIds = useMemo(
    () => new Set(daySegments[String(day.day)] || []),
    [daySegments, day.day]
  );

  const lodgingPlaceIds = useMemo(
    () => new Set(lodgings.map((l) => l.placeId).filter(Boolean) as string[]),
    [lodgings]
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

  const [poiLayers, setPoiLayers] = useState(MAP_POI_LAYERS_OFF);
  const availablePoiLayers = useMemo(
    () => ({
      fuel: corridorPois.some((p) => p.kind === "fuel"),
      hospital: corridorPois.some((p) => p.kind === "hospital"),
      charger: false,
      vet: corridorPois.some((p) => p.kind === "veterinary"),
    }),
    [corridorPois]
  );

  const center: [number, number] = useMemo(() => {
    const hk = places.hradec_kralove;
    return hk ? [hk.lat, hk.lng] : [55, 12];
  }, [places]);

  const radarLimited = showRadar;

  return (
    <>
      {fullscreen ? <div className="h-full min-h-0 w-full" aria-hidden /> : null}
      <div
        ref={wrapRef}
        className={
          fullscreen
            ? "fixed inset-0 z-[5000] overscroll-none bg-background"
            : "relative h-full w-full min-h-0"
        }
      >
      <div
        className={`pointer-events-none absolute left-14 top-2 z-[1000] flex flex-col gap-1.5 ${
          fullscreen ? "pt-[env(safe-area-inset-top)]" : ""
        }`}
      >
        <div className="pointer-events-auto">
          <RadarTimeline
            frames={frames}
            currentIndex={currentIndex}
            referenceTime={referenceTime}
            isPlaying={isPlaying}
            playMode={playMode}
            loading={radarLoading}
            hasForecast={hasForecast}
            showRadar={showRadar}
            onPlayHistory={onPlayHistory}
            onPlayForecast={onPlayForecast}
            onToggleRadar={onToggleRadar}
          />
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-md backdrop-blur-sm transition ${
              fullscreen
                ? "border-neutral-700 bg-neutral-900 text-white"
                : "border-border bg-card/95 text-foreground hover:bg-muted"
            }`}
            title={fullscreen ? "Ukončit celou obrazovku" : "Mapa na celou obrazovku"}
            aria-label={fullscreen ? "Ukončit celou obrazovku" : "Mapa na celou obrazovku"}
          >
            {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            {fullscreen ? "Zavřít" : "Celá obrazovka"}
          </button>
          <MapPoiLayerToggles
            layers={poiLayers}
            available={availablePoiLayers}
            onToggle={(id: MapPoiLayer) => setPoiLayers((s) => ({ ...s, [id]: !s[id] }))}
          />
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={5}
        minZoom={4}
        maxZoom={18}
        className="h-full w-full"
        scrollWheelZoom={false}
        touchZoom
        doubleClickZoom
        preferCanvas
      >
        <MapInvalidateSize nonce={fullscreen ? 1 : 0} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showRadar && currentFrame && (
          <RadarPrecipitationLayer tileUrl={currentFrame.tileUrl} opacity={0.5} />
        )}
        <MapScrollBehavior />
        {onRadarAutoDisable && (
          <RadarAutoDisable showRadar={showRadar} onDisable={onRadarAutoDisable} />
        )}
        <FitRouteBounds places={places} enabled={!zoomToDay} radarLimited={radarLimited} />
        <FitDayBounds
          segments={segments}
          daySegments={daySegments}
          day={day.day}
          places={places}
          selectedPlaceId={selectedPlaceId}
          enabled={zoomToDay}
          radarLimited={radarLimited}
          fitNonce={fitNonce}
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
          // Lodging nights use the house pin instead of the flag
          if (lodgingPlaceIds.has(id)) return null;
          const active = activePlaceIds.has(id);
          const label = place.dayLabel ?? "";
          const isFerry = place.markerKind === "ferry" || id.includes("_ferry");
          return (
            <Marker
              key={id}
              position={[place.lat, place.lng]}
              icon={isFerry ? makeFerryIcon() : makeFlagIcon(place.country, label, active)}
              eventHandlers={hoverPopupHandlers()}
              zIndexOffset={isFerry ? 300 : 100}
            >
              <PlacePopup place={place} dayLabel={isFerry ? "" : label} />
            </Marker>
          );
        })}
        <LodgingMarkers lodgings={lodgings} />
        <CorridorPoiMarkers
          segments={segments}
          activeSegmentIds={activeSegmentIds}
          corridorPois={corridorPois}
          shops={shops}
          layers={poiLayers}
        />
        <FishingSpotMarkers
          segments={segments}
          activeSegmentIds={activeSegmentIds}
          spots={fishingSpots}
        />
        <BorderCrossingMarkers crossings={borderCrossings} />
        <TrafficIncidentMarkers incidents={trafficIncidents} />
      </MapContainer>
      </div>
    </>
  );
}
