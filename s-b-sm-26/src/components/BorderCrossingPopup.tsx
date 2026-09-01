import { Popup } from "react-leaflet";
import NavigateButton from "./NavigateButton";
import { formatCoords } from "@/lib/navLink";
import type { BorderCrossingAlt } from "@/types/trip";

export default function BorderCrossingPopup({ crossing }: { crossing: BorderCrossingAlt }) {
  const planned = crossing.kind === "planned";
  const detour =
    crossing.detourMin <= 0
      ? "bez navýšení času (OSRM)"
      : `zajížďka ~${crossing.detourMin} min`;

  return (
    <Popup minWidth={230} maxWidth={300}>
      <strong>{crossing.name}</strong>
      <br />
      <span className="text-xs text-gray-600">
        {planned ? "Plánovaný hraniční přechod na trase" : "Alternativní hraniční přechod"}
      </span>
      {!planned && crossing.nearPlannedName ? (
        <>
          <br />
          <span className="text-xs text-gray-600">u plánovaného: {crossing.nearPlannedName}</span>
        </>
      ) : null}
      {!planned ? (
        <>
          <br />
          <span className="text-xs text-gray-700">
            {crossing.airKm} km vzdušnou čarou · {detour}
          </span>
        </>
      ) : null}
      <br />
      <span className="text-xs font-medium text-gray-800">
        Otevírací doba: {crossing.openingHoursLabel}
      </span>
      {crossing.note ? (
        <>
          <br />
          <span className="text-xs text-gray-600">{crossing.note}</span>
        </>
      ) : null}
      <br />
      <span className="text-xs text-gray-500">{formatCoords(crossing.lat, crossing.lng)}</span>
      <div className="mt-1.5 flex flex-col gap-1">
        {crossing.website ? (
          <a
            href={crossing.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-700 underline"
          >
            Web přechodu
          </a>
        ) : null}
        <NavigateButton lat={crossing.lat} lng={crossing.lng} label={crossing.name} variant="link">
          Plánovat cestu
        </NavigateButton>
      </div>
    </Popup>
  );
}
