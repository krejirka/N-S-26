import L from "leaflet";

export function makeChargerIcon(tesla?: boolean) {
  const title = tesla ? "Tesla Supercharger" : "Nabíjecí stanice";
  const bg = tesla ? "#cc0000" : "#0f766e";
  return L.divIcon({
    className: "ev-charger-marker-wrap",
    html: `<span class="ev-charger-marker" title="${title}" aria-label="${title}" style="background:${bg}">
      <svg viewBox="0 0 12 12" width="11" height="11" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.2 1L3 7h2.4L4.8 11 9 5.2H6.6L7.2 1z" fill="#fff"/>
      </svg>
    </span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}
