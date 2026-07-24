import L from "leaflet";

/** Compact ferry terminal pin. */
export function makeFerryIcon() {
  return L.divIcon({
    className: "ferry-marker-wrap",
    html: `<div class="ferry-marker" title="Trajekt" aria-label="Trajekt">
      <svg viewBox="0 0 28 28" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="#1d4ed8" stroke="#fff" stroke-width="2"/>
        <path fill="#fff" d="M6 16.5l2.2-5.2h11.6L22 16.5H6zm1.5 1.2h13c.6 1.2.6 2.3 0 2.8H7.5c-.6-.5-.6-1.6 0-2.8zM10 9.2h8l-.8-2.2h-6.4L10 9.2z"/>
      </svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}
