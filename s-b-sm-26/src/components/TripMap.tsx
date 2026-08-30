import { useMemo, useState } from "react";
import { MapContainer, Polyline, Marker } from "react-leaflet";
import type {
  BorderCrossingAlt,
  CorridorPoi,
  EvCharger,
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
import { hikeForDay, hikeTrackLatLngs } from "@/lib/hikes";
import { MAP_POI_LAYERS_OFF, type MapPoiLayer } from "@/lib/mapPoiLayers";
import RadarPrecipitationLayer from "./RadarPrecipitationLayer";
import RadarTimeline from "./RadarTimeline";
import PlacePopup from "./PlacePopup";
import LodgingMarkers from "./LodgingMarkers";
import CorridorPoiMarkers from "./CorridorPoiMarkers";
import FishingSpotMarkers from "./FishingSpotMarkers";
import TrafficIncidentMarkers from "./TrafficIncidentMarkers";
import BorderCrossingMarkers from "./BorderCrossingMarkers";
import HikingTrailLayer from "./HikingTrailLayer";
import GpsLocateControl from "./GpsLocateControl";
import ElevationProfile from "./ElevationProfile";
import MapPoiLayerToggles from "./MapPoiLayerToggles";
import BasemapLayers from "./BasemapLayers";
import type { TrafficIncident } from "@/hooks/useDayIncidents";
import { hoverPopupHandlers } from "@/lib/hoverPopup";
import { useOnline } from "@/hooks/useOnline";
import {
  FitDayBounds,
  FitRouteBounds,
  MapScrollBehavior,
  RadarAutoDisable,
} from "./MapControls";
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
  evChargers?: EvCharger[];
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
  evChargers = [],
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
  const hike = useMemo(() => hikeForDay(day.day), [day.day]);
  const showHike = Boolean(hike && zoomToDay);
  const hikePositions = useMemo(() => (hike ? hikeTrackLatLngs(hike) : []), [hike]);
  const online = useOnline();

  const [extraTopo, setExtraTopo] = useState(false);
  const [gpsOn, setGpsOn] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [poiLayers, setPoiLayers] = useState(MAP_POI_LAYERS_OFF);
  const topoOn = showHike || extraTopo;

  const availablePoiLayers = useMemo(
    () => ({
      fuel: corridorPois.some((p) => p.kind === "fuel"),
      hospital: corridorPois.some((p) => p.kind === "hospital"),
      charger: evChargers.length > 0,
      vet: corridorPois.some((p) => p.kind === "veterinary"),
    }),
    [corridorPois, evChargers]
  );

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
    if (showHike && hike) {
      for (const id of hike.placeIds) ids.add(id);
    }
    return ids;
  }, [segments, activeSegmentIds, selectedPlaceId, showHike, hike]);

  const center: [number, number] = useMemo(() => {
    const hk = places.hradec_kralove;
    return hk ? [hk.lat, hk.lng] : [55, 12];
  }, [places]);

  const radarLimited = showRadar;

  return (
    <div className="relative h-full w-full min-h-0">
      <div className="pointer-events-none absolute left-14 top-2 z-[1000] flex flex-col gap-1.5">
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
          {!online && (
            <span className="rounded-lg border border-amber-700/50 bg-amber-950/90 px-2.5 py-1.5 text-[10px] font-medium text-amber-50 shadow-md">
              Offline mapa · počasí, provoz a radar až s daty
            </span>
          )}
          <button
            type="button"
            onClick={() => setExtraTopo((v) => (showHike ? false : !v))}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-md backdrop-blur-sm transition ${
              topoOn
                ? "border-amber-700 bg-amber-800 text-white"
                : "border-border bg-card/95 text-foreground hover:bg-muted"
            }`}
            title="OpenTopoMap + OSM turistické značky (Waymarked Trails)"
          >
            Turistická
          </button>
          <button
            type="button"
            onClick={() => setGpsOn((v) => !v)}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-md backdrop-blur-sm transition ${
              gpsOn
                ? "border-sky-700 bg-sky-600 text-white"
                : "border-border bg-card/95 text-foreground hover:bg-muted"
            }`}
            title={gpsStatus || "Moje poloha (GPS telefonu)"}
          >
            GPS
          </button>
          <MapPoiLayerToggles
            layers={poiLayers}
            available={availablePoiLayers}
            onToggle={(id: MapPoiLayer) => setPoiLayers((s) => ({ ...s, [id]: !s[id] }))}
          />
        </div>
      </div>

      {showHike && hike?.profile && (
        <div className="pointer-events-none absolute bottom-8 left-2 right-2 z-[1000] max-w-md lg:left-14">
          <div className="pointer-events-auto rounded-lg border border-border bg-card/95 px-2.5 py-1.5 shadow-md backdrop-blur-sm">
            <ElevationProfile profile={hike.profile} compact />
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={5}
        minZoom={4}
        maxZoom={18}
        className="h-full w-full"
        scrollWheelZoom={false}
        touchZoom
        doubleClickZoom
      >
        <BasemapLayers online={online} topoOn={topoOn} />
        {online && showRadar && currentFrame && (
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
          extraPoints={showHike ? hikePositions : undefined}
          hikeView={showHike}
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
        {showHike && hike && <HikingTrailLayer hike={hike} positions={hikePositions} />}
        {Object.entries(places).map(([id, place]) => {
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
          evChargers={evChargers}
          layers={poiLayers}
        />
        <FishingSpotMarkers
          segments={segments}
          activeSegmentIds={activeSegmentIds}
          spots={fishingSpots}
        />
        <BorderCrossingMarkers crossings={borderCrossings} />
        <TrafficIncidentMarkers incidents={trafficIncidents} />
        <GpsLocateControl
          enabled={gpsOn}
          trailLatLngs={showHike ? hikePositions : undefined}
          onStatus={setGpsStatus}
        />
      </MapContainer>
    </div>
  );
}
