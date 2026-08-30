import { Marker } from "react-leaflet";
import { makeZollIcon } from "@/lib/zollMarker";
import { hoverPopupHandlers } from "@/lib/hoverPopup";
import type { BorderCrossingAlt } from "@/types/trip";
import BorderCrossingPopup from "./BorderCrossingPopup";

interface BorderCrossingMarkersProps {
  crossings: BorderCrossingAlt[];
}

export default function BorderCrossingMarkers({ crossings }: BorderCrossingMarkersProps) {
  if (!crossings.length) return null;

  return (
    <>
      {crossings.map((crossing) => (
        <Marker
          key={crossing.id}
          position={[crossing.lat, crossing.lng]}
          icon={makeZollIcon()}
          eventHandlers={hoverPopupHandlers()}
          zIndexOffset={280}
        >
          <BorderCrossingPopup crossing={crossing} />
        </Marker>
      ))}
    </>
  );
}
