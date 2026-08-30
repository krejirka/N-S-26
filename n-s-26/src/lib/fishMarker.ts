import L from "leaflet";

/** Compact fish pin — readable on map without clutter. */
export function makeFishIcon() {
  return L.divIcon({
    className: "fish-marker-wrap",
    html: `<span class="fish-marker" title="Rybaření" aria-label="Rybářské místo">
      <svg viewBox="0 0 20 12" width="16" height="10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M1.5 6c2.2-3.2 5-4.8 8.2-4.8 2.4 0 4.4.8 6.2 2.2L18.5 1.5v9L15.9 8.6C14.1 10 12.1 10.8 9.7 10.8 6.5 10.8 3.7 9.2 1.5 6z" fill="#0e7490"/>
        <circle cx="5.2" cy="5.2" r="0.9" fill="#ecfeff"/>
        <path d="M1.5 6l-1.2 2.2L1.5 6 0.3 3.8z" fill="#0e7490"/>
      </svg>
    </span>`,
    iconSize: [18, 12],
    iconAnchor: [9, 6],
    popupAnchor: [0, -6],
  });
}
