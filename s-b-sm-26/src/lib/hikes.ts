import musalaHike from "@/data/hike-jastrebec-musala.json";
import type { HikingRoute } from "@/types/trip";

const HIKES: HikingRoute[] = [musalaHike as HikingRoute];

export function hikeForDay(day: number): HikingRoute | null {
  return HIKES.find((h) => h.day === day) ?? null;
}

export function hikeTrackLatLngs(hike: HikingRoute): [number, number][] {
  return hike.track.map(([lng, lat]) => [lat, lng]);
}