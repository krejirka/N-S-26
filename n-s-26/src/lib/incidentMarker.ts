import L from "leaflet";

/** Yellow digger = roadworks; red = closed; amber = accident. */
export function makeIncidentIcon(category: number) {
  if (category === 9) {
    return L.divIcon({
      className: "incident-marker-wrap",
      html: `<span class="incident-marker incident-roadworks" title="Stavební práce" aria-label="Stavební práce">
        <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#facc15" stroke="#111" stroke-width="1.5"/>
          <path d="M7.5 15.5h9v1.2H7.5zm1.2-1.2l1.3-4.2h1.1L12.5 14h-1.2l-.3-1H9.3l-.3 1zm2.2-2.2h1.1l-.35 1.1h-1.1z" fill="#111"/>
          <circle cx="9.2" cy="16.8" r="1.1" fill="#111"/><circle cx="14.8" cy="16.8" r="1.1" fill="#111"/>
          <path d="M14.2 8.2l2.8-1.6.5.9-1.6 1 1.3.4-.4 1.1-3.2-1.2.6-.6z" fill="#111"/>
        </svg>
      </span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -10],
    });
  }
  if (category === 8 || category === 7) {
    return L.divIcon({
      className: "incident-marker-wrap",
      html: `<span class="incident-marker incident-closed" title="Uzavírka" aria-label="Uzavírka">
        <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#ef4444" stroke="#111" stroke-width="1.5"/>
          <rect x="6" y="10.5" width="12" height="3" rx="0.5" fill="#fff"/>
        </svg>
      </span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -10],
    });
  }
  return L.divIcon({
    className: "incident-marker-wrap",
    html: `<span class="incident-marker incident-accident" title="Nehoda" aria-label="Nehoda">
      <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#f97316" stroke="#111" stroke-width="1.5"/>
        <path d="M12 6.5l5.5 10H6.5L12 6.5z" fill="#fff"/>
        <rect x="11.2" y="10" width="1.6" height="3.5" fill="#111"/>
        <circle cx="12" cy="15.2" r="0.9" fill="#111"/>
      </svg>
    </span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });
}
