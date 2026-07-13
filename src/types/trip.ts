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
