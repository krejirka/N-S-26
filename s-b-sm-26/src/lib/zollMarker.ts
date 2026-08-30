import L from "leaflet";

/** Vienna Convention customs sign (ZOLL / DOUANE). */
export function makeZollIcon() {
  return L.divIcon({
    className: "zoll-marker-wrap",
    html: `<div class="zoll-marker" title="Hraniční přechod" aria-label="Hraniční přechod">
      <svg viewBox="0 0 64 64" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="29.5" fill="#fff" stroke="#e30613" stroke-width="5"/>
        <text x="32" y="23.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="9.5" font-weight="800" fill="#111">ZOLL</text>
        <rect x="13" y="27.5" width="38" height="9" fill="#111"/>
        <text x="32" y="49.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="8" font-weight="800" fill="#111">DOUANE</text>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}
