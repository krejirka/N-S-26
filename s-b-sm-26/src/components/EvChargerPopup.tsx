import { Popup } from "react-leaflet";
import NavigateButton from "./NavigateButton";
import { formatCoords } from "@/lib/navLink";
import type { EvCharger } from "@/types/trip";

export default function EvChargerPopup({ charger }: { charger: EvCharger }) {
  return (
    <Popup minWidth={230} maxWidth={300}>
      <strong>{charger.name}</strong>
      <br />
      <span className="text-xs text-gray-600">
        {charger.tesla ? "Tesla Supercharger" : "Nabíjení elektromobilu"}
        {charger.operator && charger.operator !== charger.name ? ` · ${charger.operator}` : ""}
      </span>
      <br />
      <span className="text-xs font-semibold text-gray-800">Výkon: {charger.powerLabel}</span>
      {charger.sockets ? (
        <>
          <br />
          <span className="text-xs text-gray-700">{charger.sockets}</span>
        </>
      ) : null}
      <br />
      <span className="text-xs font-medium text-gray-800">
        Otevírací doba: {charger.openingHoursLabel}
      </span>
      {charger.address ? (
        <>
          <br />
          <span className="text-xs text-gray-700">{charger.address}</span>
        </>
      ) : null}
      <br />
      <span className="text-xs text-gray-500">{formatCoords(charger.lat, charger.lng)}</span>
      <div className="mt-1.5 flex flex-col gap-1">
        {charger.website ? (
          <a
            href={charger.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-700 underline"
          >
            Web stanice
          </a>
        ) : null}
        <NavigateButton lat={charger.lat} lng={charger.lng} label={charger.name} variant="link">
          Navigovat k nabíječce
        </NavigateButton>
      </div>
    </Popup>
  );
}
