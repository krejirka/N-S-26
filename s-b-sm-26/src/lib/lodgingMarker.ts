import L from "leaflet";

/** Airbnb-style black pin with white house + label below. */
export function makeLodgingIcon(title: string, dateLabel: string) {
  const safeTitle = escapeHtml(title);
  const safeDate = escapeHtml(dateLabel);
  return L.divIcon({
    className: "lodging-marker-wrap",
    html: `<div class="lodging-marker">
      <div class="lodging-pin" aria-hidden="true">
        <svg viewBox="0 0 24 32" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
          <path fill="#111" d="M12 0C6.5 0 2 4.5 2 10c0 7.5 10 22 10 22s10-14.5 10-22C22 4.5 17.5 0 12 0z"/>
          <path fill="#fff" d="M8.2 15.2V11.8l3.8-3 3.8 3v3.4h-2.2v-2.2h-3.2v2.2H8.2z"/>
        </svg>
      </div>
      <div class="lodging-label">
        <div class="lodging-title">${safeTitle}</div>
        <div class="lodging-dates">${safeDate}</div>
      </div>
    </div>`,
    iconSize: [96, 58],
    iconAnchor: [48, 36],
    popupAnchor: [0, -34],
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
