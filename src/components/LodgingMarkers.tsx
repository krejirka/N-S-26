import { Marker } from "react-leaflet";
import { makeLodgingIcon } from "@/lib/lodgingMarker";
import { hoverPopupHandlers } from "@/lib/hoverPopup";
import type { LodgingPoi } from "@/types/trip";
import LodgingPopup from "./LodgingPopup";

export default function LodgingMarkers({ lodgings }: { lodgings: LodgingPoi[] }) {
  return (
    <>
      {lodgings.map((lodging) => (
        <Marker
          key={lodging.id}
          position={[lodging.lat, lodging.lng]}
          icon={makeLodgingIcon(lodging.title, lodging.dateLabel)}
          eventHandlers={hoverPopupHandlers()}
          zIndexOffset={400}
        >
          <LodgingPopup lodging={lodging} />
        </Marker>
      ))}
    </>
  );
}
