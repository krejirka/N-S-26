import L from "leaflet";
import type { ShopKind } from "@/types/trip";

export function makeShopIcon(kind: ShopKind) {
  const cls = kind === "ikea" ? "shop-marker shop-marker-ikea" : "shop-marker shop-marker-dollarstore";
  const title = kind === "ikea" ? "IKEA" : "Dollarstore";
  return L.divIcon({
    className: "shop-marker-wrap",
    html: `<span class="${cls}" title="${title}" aria-label="${title}"></span>`,
    iconSize: [10, 8],
    iconAnchor: [5, 4],
    popupAnchor: [0, -4],
  });
}
