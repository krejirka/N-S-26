/** Navigation deep links (Android chooser + store apps + web fallbacks). */

export function navigationUrl(lat: number, lng: number, label: string): string {
  const name = label.trim() || "Cíl";
  const q = encodeURIComponent(`${lat},${lng}(${name})`);
  return `geo:${lat},${lng}?q=${q}`;
}

export function googleMapsNavigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function wazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;
}

export function appleMapsUrl(lat: number, lng: number, label: string): string {
  const daddr = encodeURIComponent(label.trim() || `${lat},${lng}`);
  return `https://maps.apple.com/?daddr=${lat},${lng}&q=${daddr}&dirflg=d`;
}

export interface NavOption {
  id: string;
  label: string;
  href: string;
  hint?: string;
}

export function navigationOptions(lat: number, lng: number, label: string): NavOption[] {
  return [
    {
      id: "google",
      label: "Google Maps",
      href: googleMapsNavigateUrl(lat, lng),
      hint: "Navigace / prohlížeč",
    },
    {
      id: "waze",
      label: "Waze",
      href: wazeUrl(lat, lng),
      hint: "Aplikace nebo web",
    },
    {
      id: "apple",
      label: "Apple Maps",
      href: appleMapsUrl(lat, lng, label),
      hint: "iPhone / Mac",
    },
    {
      id: "geo",
      label: "Systémová navigace",
      href: navigationUrl(lat, lng, label),
      hint: "Android — výběr aplikace",
    },
  ];
}

export function mapyCzTouristUrl(lat: number, lng: number, zoom = 14): string {
  return `https://mapy.cz/turisticka?x=${lng}&y=${lat}&z=${zoom}`;
}

/** Human-readable coordinates for popups. */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
