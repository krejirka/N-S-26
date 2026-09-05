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

/** Musala hike cutout (from hike.pmtiles metadata). */
const HIKE_BOUNDS: LatLngBoundsExpression = [
  [42.044443, 23.395889],
  [42.361687, 23.771282],
];

type ProtomapsFileLayerProps = {
  file: string;
  maxZoom: number;
  maxDataZoom: number;
  minZoom?: number;
  bounds?: LatLngBoundsExpression;
  /** Drop opaque basemap fill so empty tiles do not blank the underlay. */
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
      ...(overlay ? { backgroundColor: undefined } : {}),
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

function OnlineOsmBasemap({ topoOn }: { topoOn: boolean }) {
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

interface BasemapLayersProps {
  /** Kept for API compatibility; native always uses packed maps (online detection is flaky). */
  online: boolean;
  topoOn: boolean;
}

/**
 * Website: online OSM / OpenTopoMap.
 *
 * Native APK: ALWAYS packed basemap.pmtiles (+ hike overlay).
 * Do not gate on `online` — Android WebView often keeps navigator.onLine=true
 * with mobile data off, which previously left the map on broken OSM tiles.
 * Packed assets need real HTTP Range from PmtilesRangeServer in MainActivity.
 */
export default function BasemapLayers({ online: _online, topoOn }: BasemapLayersProps) {
  if (!IS_NATIVE) {
    return <OnlineOsmBasemap topoOn={topoOn} />;
  }

  return (
    <>
      <ProtomapsFileLayer file="basemap.pmtiles" minZoom={0} maxZoom={17} maxDataZoom={14} />
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
    </>
  );
}
