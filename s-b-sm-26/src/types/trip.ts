export interface PlaceLink {
  label: string;
  url: string;
}

export interface PlaceImage {
  url: string;
  alt: string;
  source: string;
  sourceUrl: string;
}

export interface EnrichedPlace {
  name: string;
  /** Odkaz na `places.json` — karta i mapa mají stejnou navigaci. */
  placeId?: string;
  links?: PlaceLink[];
  image?: PlaceImage;
  tips?: string[];
}

export interface TripDay {
  day: number;
  date: string;
  weekday: string;
  destination: string;
  km: number | null;
  lodging: string | null;
  logistics: string;
  program: string;
  placeId: string;
  /** Kam navigovat autem, pokud se liší od placeId (např. lanovka místo vrcholu). */
  navPlaceId?: string;
  phase: "tam" | "zpět";
  segmentIds?: string[];
  places: EnrichedPlace[];
}

export interface Itinerary {
  meta: {
    title: string;
    origin: string;
    destination: string;
    highlights: string[];
    totalDays: number;
    totalKmExcel: number;
    note: string;
  };
  days: TripDay[];
}

export interface Place {
  name: string;
  lat: number;
  lng: number;
  country: string;
  dayLabel?: string;
  address?: string;
  markerKind?: "ferry" | "flag";
}

export type ShopKind = "ikea" | "dollarstore";

export interface ShopPoi {
  id: string;
  kind: ShopKind;
  name: string;
  address: string;
  country: string;
  lat: number;
  lng: number;
}

export interface ShopsData {
  note?: string;
  generatedAt?: string;
  shops: ShopPoi[];
}

export interface LodgingPoi {
  id: string;
  title: string;
  dateLabel: string;
  name: string;
  address: string;
  country: string;
  lat: number;
  lng: number;
  notes?: string[];
  placeId?: string;
}

export interface LodgingsData {
  note?: string;
  lodgings: LodgingPoi[];
}

export type CorridorPoiKind = "fuel" | "hospital" | "veterinary";

export interface CorridorPoi {
  id: string;
  kind: CorridorPoiKind;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  emergency?: boolean;
  fuel95?: boolean;
  phone?: string;
  website?: string;
}

export interface CorridorPoisData {
  note?: string;
  generatedAt?: string | null;
  pois: CorridorPoi[];
}

export type EvFeeKind = "yes" | "no" | "unknown";

export interface EvCharger {
  id: string;
  name: string;
  operator?: string | null;
  tesla?: boolean;
  lat: number;
  lng: number;
  maxKw?: number | null;
  powerLabel: string;
  sockets?: string | null;
  /** Total stalls / connectors when known (OSM or supercharge.info). */
  stallsTotal?: number | null;
  fee?: EvFeeKind;
  feeLabel?: string;
  openingHours?: string | null;
  openingHoursLabel: string;
  address?: string;
  website?: string | null;
  teslaLocationId?: string | null;
  teslaOtherEvs?: boolean | null;
  osmId?: string | null;
}

/** Live availability matched onto a static charger (TomTom). */
export interface EvLiveStatus {
  available: number | null;
  total: number | null;
  occupied?: number | null;
  maxPowerKW?: number | null;
  live: boolean;
  tesla?: boolean;
  name?: string;
  fetchedAt?: string;
}

export interface EvChargersData {
  note?: string;
  generatedAt?: string | null;
  chargers: EvCharger[];
}

export interface FishingSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  species?: string[];
  tip: string;
  permitLabel: string;
  permitUrl: string;
}

export interface FishingSpotsData {
  note?: string;
  spots: FishingSpot[];
}

export type BorderCrossingKind = "planned" | "alternative";

export interface BorderCrossingAlt {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind?: BorderCrossingKind;
  nearPlannedId?: string;
  nearPlannedName?: string;
  airKm: number;
  detourMin: number;
  pair?: string;
  openingHours?: string | null;
  openingHoursLabel: string;
  website?: string | null;
  note?: string | null;
}

export interface PlannedBorderCrossing {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pair?: string;
  kind?: BorderCrossingKind;
  openingHoursLabel?: string;
  note?: string | null;
}

export interface SkippedBorderCrossing {
  id: string;
  name: string;
  pair: string;
  nearPlannedName?: string;
  airKm: number;
  detourMin: number;
}

export interface BorderCrossingsData {
  note?: string;
  generatedAt?: string | null;
  planned: PlannedBorderCrossing[];
  alternatives: BorderCrossingAlt[];
  skipped?: SkippedBorderCrossing[];
}

export interface RouteSegment {
  id: string;
  from: string;
  to: string;
  kind: "road" | "ferry";
  phase: "tam" | "zpět";
  dayLabel: string;
  name: string;
  distanceKm: number;
  durationHours: number | null;
  geometry: [number, number][];
  source: string;
}

export interface RoutesData {
  generatedAt: string;
  totalDistanceKm: number;
  segments: RouteSegment[];
}

export interface PlacesData {
  places: Record<string, Place>;
  daySegments: Record<string, string[]>;
}

export type HikePoiKind = "peak" | "hut" | "shelter" | "station" | "poi";

export interface HikePoi {
  id: string;
  kind: HikePoiKind;
  name: string;
  lat: number;
  lng: number;
  ele: number | null;
}

export interface HikeElevationSample {
  km: number;
  ele: number;
  lat: number;
  lng: number;
}

export interface HikeProfileLabel {
  id: string;
  name: string;
  km: number;
  ele: number;
  kind: HikePoiKind | "start" | "end";
}

export interface HikeElevationProfile {
  source: string;
  ascentM: number;
  descentM: number;
  minEle: number;
  maxEle: number;
  samples: HikeElevationSample[];
  labels: HikeProfileLabel[];
}

/** Foot track; `track` is GeoJSON [lng, lat] like route segments. */
export interface HikingRoute {
  id: string;
  day: number;
  name: string;
  fromPlaceId: string;
  toPlaceId: string;
  placeIds: string[];
  distanceKm: number;
  source: string;
  generatedAt: string;
  note?: string;
  track: [number, number][];
  pois: HikePoi[];
  profile?: HikeElevationProfile;
}
