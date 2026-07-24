import { useEffect, useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import { makeShopIcon } from "@/lib/shopMarker";
import type { ShopPoi } from "@/types/trip";
import ShopPopup from "./ShopPopup";

/** Tiny shop markers — visible from mid zoom so the route stays readable. */
const MIN_SHOP_ZOOM = 6;

interface ShopMarkersProps {
  shops: ShopPoi[];
}

export default function ShopMarkers({ shops }: ShopMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    setZoom(map.getZoom());
  }, [map]);

  if (zoom < MIN_SHOP_ZOOM) return null;

  return (
    <>
      {shops.map((shop) => (
        <Marker
          key={shop.id}
          position={[shop.lat, shop.lng]}
          icon={makeShopIcon(shop.kind)}
          eventHandlers={{
            mouseover: (e) => e.target.openPopup(),
          }}
          zIndexOffset={-200}
        >
          <ShopPopup shop={shop} />
        </Marker>
      ))}
    </>
  );
}
