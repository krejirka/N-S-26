import { Popup } from "react-leaflet";
import NavigateButton from "./NavigateButton";
import { formatCoords } from "@/lib/navLink";
import type { LodgingPoi } from "@/types/trip";

export default function LodgingPopup({ lodging }: { lodging: LodgingPoi }) {
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
      <NavigateButton lat={lodging.lat} lng={lodging.lng} label={lodging.name} variant="link" />
    </Popup>
  );
}
