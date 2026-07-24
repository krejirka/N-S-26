import { useEffect, useMemo, useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import { makeCorridorPoiIcon, makeShopIcon } from "@/lib/shopMarker";
import { dayRouteGeometry, filterByCorridor } from "@/lib/corridorFilter";
import type { CorridorPoi, RouteSegment, ShopPoi } from "@/types/trip";
import { CorridorPoiPopup, ShopCorridorPopup } from "./CorridorPoiPopup";

const MIN_ZOOM_SHOPS = 6;
const MIN_ZOOM_SERVICES = 7;
const FUEL_KM = 20;
const SERVICE_KM = 50;
const SHOP_KM = 50;

interface CorridorPoiMarkersProps {
  segments: RouteSegment[];
  activeSegmentIds: Set<string>;
  corridorPois: CorridorPoi[];
  shops: ShopPoi[];
}

export default function CorridorPoiMarkers({
  segments,
  activeSegmentIds,
  corridorPois,
  shops,
}: CorridorPoiMarkersProps) {
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

  const fuels = useMemo(
    () =>
      filterByCorridor(
        corridorPois.filter((p) => p.kind === "fuel"),
        geometry,
        FUEL_KM
      ),
    [corridorPois, geometry]
  );

  const hospitals = useMemo(
    () =>
      filterByCorridor(
        corridorPois.filter((p) => p.kind === "hospital"),
        geometry,
        SERVICE_KM
      ),
    [corridorPois, geometry]
  );

  const vets = useMemo(
    () =>
      filterByCorridor(
        corridorPois.filter((p) => p.kind === "veterinary"),
        geometry,
        SERVICE_KM
      ),
    [corridorPois, geometry]
  );

  const nearShops = useMemo(() => filterByCorridor(shops, geometry, SHOP_KM), [shops, geometry]);

  if (!geometry.length) return null;

  return (
    <>
      {zoom >= MIN_ZOOM_SHOPS &&
        nearShops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            icon={makeShopIcon(shop.kind)}
            eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            zIndexOffset={-180}
          >
            <ShopCorridorPopup shop={shop} />
          </Marker>
        ))}
      {zoom >= MIN_ZOOM_SERVICES &&
        fuels.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={makeCorridorPoiIcon("fuel")}
            eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            zIndexOffset={-220}
          >
            <CorridorPoiPopup poi={poi} />
          </Marker>
        ))}
      {zoom >= MIN_ZOOM_SERVICES &&
        hospitals.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={makeCorridorPoiIcon("hospital")}
            eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            zIndexOffset={-210}
          >
            <CorridorPoiPopup poi={poi} />
          </Marker>
        ))}
      {zoom >= MIN_ZOOM_SERVICES &&
        vets.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={makeCorridorPoiIcon("veterinary")}
            eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            zIndexOffset={-210}
          >
            <CorridorPoiPopup poi={poi} />
          </Marker>
        ))}
    </>
  );
}
