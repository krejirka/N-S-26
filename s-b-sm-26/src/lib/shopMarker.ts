import L from "leaflet";
import type { ShopKind } from "@/types/trip";
import type { CorridorPoiKind } from "@/types/trip";

export function makeShopIcon(kind: ShopKind) {
  if (kind === "ikea") {
    return L.divIcon({
      className: "shop-marker-wrap",
      html: `<span class="shop-marker shop-marker-ikea" title="IKEA" aria-label="IKEA"><span class="ikea-bar"></span></span>`,
      iconSize: [12, 9],
      iconAnchor: [6, 4],
      popupAnchor: [0, -4],
    });
  }
  return L.divIcon({
    className: "shop-marker-wrap",
    html: `<span class="shop-marker shop-marker-dollarstore" title="Dollarstore" aria-label="Dollarstore">$</span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -5],
  });
}

export function makeCorridorPoiIcon(kind: CorridorPoiKind) {
  if (kind === "fuel") {
    return L.divIcon({
      className: "corridor-marker-wrap",
      html: `<span class="corridor-marker corridor-fuel" title="Natural 95" aria-label="Čerpací stanice Natural 95">
        <svg viewBox="0 0 12 14" width="10" height="12" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="6" height="12" rx="1" fill="#dc2626"/>
          <rect x="2.2" y="2.5" width="3.6" height="3" fill="#fecaca"/>
          <path d="M7.5 4h1.2v5.5a1.2 1.2 0 002.4 0V6" stroke="#991b1b" stroke-width="1.2" fill="none"/>
        </svg>
      </span>`,
      iconSize: [10, 12],
      iconAnchor: [5, 6],
      popupAnchor: [0, -5],
    });
  }
  if (kind === "hospital") {
    return L.divIcon({
      className: "corridor-marker-wrap",
      html: `<span class="corridor-marker corridor-hospital" title="Nemocnice" aria-label="Nemocnice s pohotovostí">
        <svg viewBox="0 0 12 12" width="11" height="11" xmlns="http://www.w3.org/2000/svg">
          <rect x="4.5" y="1" width="3" height="10" rx="0.5" fill="#dc2626"/>
          <rect x="1" y="4.5" width="10" height="3" rx="0.5" fill="#dc2626"/>
        </svg>
      </span>`,
      iconSize: [11, 11],
      iconAnchor: [5, 5],
      popupAnchor: [0, -5],
    });
  }
  return L.divIcon({
    className: "corridor-marker-wrap",
    html: `<span class="corridor-marker corridor-vet" title="Veterina" aria-label="Veterinární pohotovost">
      <svg viewBox="0 0 12 12" width="11" height="11" xmlns="http://www.w3.org/2000/svg">
        <rect x="4.5" y="1" width="3" height="10" rx="0.5" fill="#ea580c"/>
        <rect x="1" y="4.5" width="10" height="3" rx="0.5" fill="#ea580c"/>
      </svg>
    </span>`,
    iconSize: [11, 11],
    iconAnchor: [5, 5],
    popupAnchor: [0, -5],
  });
}
