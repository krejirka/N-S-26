import { Popup } from "react-leaflet";
import { ExternalLink } from "lucide-react";
import { formatCoords, navigationUrl } from "@/lib/navLink";
import type { LodgingPoi } from "@/types/trip";

export default function LodgingPopup({ lodging }: { lodging: LodgingPoi }) {
  const navHref = navigationUrl(lodging.lat, lodging.lng, lodging.name);

  return (
    <Popup minWidth={240}>
      <strong>{lodging.name}</strong>
      <br />
      <span className="text-xs text-gray-600">
        {lodging.title} · {lodging.dateLabel}
      </span>
      <br />
      <span className="text-xs text-gray-700">{lodging.address}</span>
      <br />
      <span className="text-xs text-gray-500">{formatCoords(lodging.lat, lodging.lng)}</span>
      {lodging.notes?.length ? (
        <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
          {lodging.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
      <a
        href={navHref}
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
      >
        Navigovat
        <ExternalLink className="h-3 w-3" />
      </a>
    </Popup>
  );
}
