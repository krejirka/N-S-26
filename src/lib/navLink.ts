/** Android-friendly navigation URL (opens app chooser: Google Maps, Waze, …). */
export function navigationUrl(lat: number, lng: number, label: string): string {
  const name = label.trim() || "Cíl";
  const q = encodeURIComponent(`${lat},${lng}(${name})`);
  return `geo:${lat},${lng}?q=${q}`;
}

/** Human-readable coordinates for popups. */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
