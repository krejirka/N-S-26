import { useEffect, useMemo, useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import { makeFishIcon } from "@/lib/fishMarker";
import { dayRouteGeometry, filterByCorridor } from "@/lib/corridorFilter";
import { hoverPopupHandlers } from "@/lib/hoverPopup";
import type { FishingSpot, RouteSegment } from "@/types/trip";
import FishingSpotPopup from "./FishingSpotPopup";

const MIN_ZOOM = 5;
const FISH_KM = 20;

interface FishingSpotMarkersProps {
  segments: RouteSegment[];
  activeSegmentIds: Set<string>;
  spots: FishingSpot[];
}

export default function FishingSpotMarkers({
  segments,
  activeSegmentIds,
  spots,
}: FishingSpotMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    setZoom(map.getZoom());
  }, [map]);

  const geometry = useMemo(
    () => dayRouteGeometry(segments, activeSegmentIds),
    [segments, activeSegmentIds]
  );

  const near = useMemo(() => filterByCorridor(spots, geometry, FISH_KM), [spots, geometry]);

  if (!geometry.length || zoom < MIN_ZOOM) return null;

  return (
    <>
      {near.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={makeFishIcon()}
          eventHandlers={hoverPopupHandlers()}
          zIndexOffset={250}
        >
          <FishingSpotPopup spot={spot} />
        </Marker>
      ))}
    </>
  );
}
