import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import type { Layer, LatLngBoundsExpression } from "leaflet";
import { leafletLayer } from "protomaps-leaflet";
import { IS_NATIVE } from "@/lib/runtime";
import { offlineAssetUrl } from "@/lib/pmtilesMemory";

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Absolute URL so Capacitor WebView Range requests hit https://localhost/offline/… */
function absoluteOfflineUrl(file: string): string {
  const rel = offlineAssetUrl(file);
  try {
    return new URL(rel, window.location.href).href;
  } catch {
    return rel;
  }
}

/** Streets pack geographic extent (from streets.pmtiles metadata). */
const STREETS_BOUNDS: LatLngBoundsExpression = [
  [41.946751, 15.59584],
  [50.317068, 23.66862],
];

/** Musala hike cutout (from hike.pmtiles metadata). */
const HIKE_BOUNDS: LatLngBoundsExpression = [
  [42.044443, 23.395889],
  [42.361687, 23.771282],
];

type ProtomapsFileLayerProps = {
  file: string;
  maxZoom: number;
  maxDataZoom: number;
  /** Leaflet GridLayer minZoom — keep high-detail packs off at overview zooms. */
  minZoom?: number;
  bounds?: LatLngBoundsExpression;
  /**
   * Overlay packs: drop solid basemap fill so empty tiles outside coverage
   * do not blank the corridor / OSM underlay underneath.
   */
  overlay?: boolean;
};

function ProtomapsFileLayer({
  file,
  maxZoom,
  maxDataZoom,
  minZoom,
  bounds,
  overlay = false,
}: ProtomapsFileLayerProps) {
  const map = useMap();

  useEffect(() => {
    const layer = leafletLayer({
      url: absoluteOfflineUrl(file),
      flavor: "light",
      lang: "cs",
      attribution: OSM_ATTR + " · Protomaps",
      maxZoom,
      maxDataZoom,
      ...(minZoom != null ? { minZoom } : {}),
      ...(bounds ? { bounds } : {}),
    }) as unknown as Layer & { backgroundColor?: string };

    if (overlay) {
      layer.backgroundColor = undefined;
    }

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, file, maxZoom, maxDataZoom, minZoom, bounds, overlay]);

  return null;
}

interface BasemapLayersProps {
  online: boolean;
  topoOn: boolean;
}

/**
 * Native APK basemap stack (continuous zoom):
 *  - corridor.pmtiles z0–12 → full-route / mid zoom (100 km)
 *  - streets.pmtiles z13–14 → city streets (~12 km), only from minZoom 13
 *  - hike.pmtiles → Musala trek overlay when topo is on
 * Website uses online OSM / OpenTopoMap tiles.
 */
export default function BasemapLayers({ online, topoOn }: BasemapLayersProps) {
  const usePacked = IS_NATIVE;
  const otmUrl = `${import.meta.env.BASE_URL}offline/otm/{z}/{x}/{y}.png`;

  if (!usePacked) {
    if (topoOn) {
      return (
        <>
          <TileLayer attribution={OSM_ATTR} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <TileLayer
            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
            opacity={0.92}
          />
          <TileLayer
            attribution='Hiking overlay &copy; <a href="https://waymarkedtrails.org">Waymarked Trails</a>'
            url="https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"
            opacity={0.9}
            maxZoom={18}
          />
        </>
      );
    }
    return <TileLayer attribution={OSM_ATTR} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />;
  }

  return (
    <>
      {/* Online OSM fills areas outside packed packs / before vectors paint. */}
      {online && (
        <TileLayer attribution={OSM_ATTR} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      )}
      {/* Overview + mid zoom (full route ≈ z5–8, detail to z12). */}
      <ProtomapsFileLayer file="corridor.pmtiles" minZoom={0} maxZoom={topoOn ? 12 : 14} maxDataZoom={12} />
      {/* Street detail — must not paint below z13 (would blank corridor). */}
      {!topoOn && (
        <ProtomapsFileLayer
          file="streets.pmtiles"
          minZoom={13}
          maxZoom={17}
          maxDataZoom={14}
          bounds={STREETS_BOUNDS}
          overlay
        />
      )}
      {topoOn && (
        <ProtomapsFileLayer
          file="hike.pmtiles"
          minZoom={10}
          maxZoom={17}
          maxDataZoom={16}
          bounds={HIKE_BOUNDS}
          overlay
        />
      )}
      {/* OTM rasters omitted from APK; hike.pmtiles covers the trek offline. */}
      {false && topoOn && (
        <TileLayer
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
          url={otmUrl}
          maxNativeZoom={17}
          maxZoom={18}
          opacity={0.92}
        />
      )}
    </>
  );
}
