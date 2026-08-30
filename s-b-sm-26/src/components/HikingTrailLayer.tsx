import { Marker, Polyline, Popup } from "react-leaflet";
import { makeHikePoiIcon } from "@/lib/hikePoiMarker";
import { formatCoords } from "@/lib/navLink";
import { hoverPopupHandlers } from "@/lib/hoverPopup";
import type { HikingRoute } from "@/types/trip";

const SKIP_PEAKS = /^(мусала|ястребец|musala|jastrebec|yastrebets)$/i;

interface HikingTrailLayerProps {
  hike: HikingRoute;
  positions: [number, number][];
}

export default function HikingTrailLayer({ hike, positions }: HikingTrailLayerProps) {
  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: "#b91c1c", weight: 5, opacity: 0.92 }}
      />
      {hike.pois.map((poi) => {
        if (poi.kind === "peak" && SKIP_PEAKS.test(poi.name.trim())) return null;
        return (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={makeHikePoiIcon(poi.kind, poi.name)}
            eventHandlers={hoverPopupHandlers()}
            zIndexOffset={80}
          >
            <Popup minWidth={180}>
              <strong>{poi.name}</strong>
              <br />
              <span className="text-xs text-gray-600">
                {poi.kind === "hut" || poi.kind === "shelter"
                  ? "Přístřešek / chata"
                  : poi.kind === "station"
                    ? "Lanovka"
                    : "Vrchol"}
              </span>
              {poi.ele != null && Number.isFinite(poi.ele) && (
                <>
                  <br />
                  <span className="text-xs text-gray-600">{Math.round(poi.ele)} m n. m.</span>
                </>
              )}
              <br />
              <span className="text-xs text-gray-500">{formatCoords(poi.lat, poi.lng)}</span>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}