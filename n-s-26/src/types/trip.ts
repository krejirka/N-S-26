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
