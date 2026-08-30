import L from "leaflet";
import type { HikePoiKind } from "@/types/trip";

export function makeHikePoiIcon(kind: HikePoiKind, title: string) {
  const label = title.replace(/"/g, "");
  const cls =
    kind === "hut" || kind === "shelter"
      ? "hike-poi-hut"
      : kind === "station"
        ? "hike-poi-station"
        : "hike-poi-peak";
  const glyph = kind === "station" ? "▲" : kind === "peak" ? "△" : "⌂";
  return L.divIcon({
    className: "hike-poi-wrap",
    html: `<span class="hike-poi-marker ${cls}" title="${label}" aria-label="${label}">${glyph}</span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}