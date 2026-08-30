/** Per-trip settings. Copy this app folder and change these values. */
export const TRIP_SLUG = "n-s-26";
export const TRIP_TITLE = "Norsko-Švédsko 2026";
/** Private trips keep the password gate. Public trips skip it. */
export const TRIP_PUBLIC = false;
/** Leaflet maxBounds SW–NE [lat, lng] — keep the route comfortably inside. */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [40, -5],
  [72, 35],
];
