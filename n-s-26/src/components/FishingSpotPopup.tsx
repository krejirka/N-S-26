import { Popup } from "react-leaflet";
import NavigateButton from "./NavigateButton";
import { formatCoords } from "@/lib/navLink";
import type { FishingSpot } from "@/types/trip";

export default function FishingSpotPopup({ spot }: { spot: FishingSpot }) {
  const species = spot.species?.length ? spot.species.join(", ") : null;

  return (
    <Popup minWidth={220} maxWidth={280}>
      <strong>{spot.name}</strong>
      <br />
      <span className="text-xs text-gray-600">{spot.country}</span>
      {species && (
        <>
          <br />
          <span className="text-xs text-teal-800">{species}</span>
        </>
      )}
      <p className="mt-1.5 text-xs leading-snug text-gray-700">{spot.tip}</p>
      <span className="text-xs text-gray-500">{formatCoords(spot.lat, spot.lng)}</span>
      <div className="mt-1.5 flex flex-col gap-1">
        <a
          href={spot.permitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-teal-700 underline"
        >
          {spot.permitLabel}
        </a>
        <NavigateButton lat={spot.lat} lng={spot.lng} label={spot.name} variant="link" />
      </div>
    </Popup>
  );
}
