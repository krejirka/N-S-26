import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import type { Layer, LatLngBoundsExpression } from "leaflet";
import { leafletLayer } from "protomaps-leaflet";
import type { PMTiles } from "pmtiles";
import { IS_NATIVE } from "@/lib/runtime";
import { nativePmtiles } from "@/lib/capacitorPmtiles";

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const HIKE_BOUNDS: LatLngBoundsExpression = [
  [42.044443, 23.395889],
  [42.361687, 23.771282],
];

type ProtomapsNativeLayerProps = {
  file: string;
  maxZoom: number;
  maxDataZoom: number;
  minZoom?: number;
  bounds?: LatLngBoundsExpression;
  overlay?: boolean;
  /** When true, skip opaque canvas fill so OSM underlay can show through. */
  clearBackground?: boolean;
  onReady?: () => void;
  onError?: (err: unknown) => void;
};

function ProtomapsNativeLayer({
  file,
  maxZoom,
  maxDataZoom,
  minZoom,
  bounds,
  overlay = false,
  clearBackground = false,
  onReady,
  onError,
}: ProtomapsNativeLayerProps) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    let layer: (Layer & { backgroundColor?: string }) | null = null;

    const archive: PMTiles = nativePmtiles(`offline/${file}`);

    // Verify header via native byte reads before attaching the layer.
    archive
      .getHeader()
      .then((header) => {
        if (cancelled) return;
        if (header.tileType !== 1 /* mvt */) {
          throw new Error(`Unexpected tile type ${header.tileType} in ${file}`);
        }
        // Cast: app and protomaps-leaflet may resolve different pmtiles package builds.
        layer = leafletLayer({
          url: archive as never,
          flavor: "light",
          lang: "cs",
          attribution: OSM_ATTR + " · Protomaps",
          maxZoom,
          maxDataZoom,
          ...(minZoom != null ? { minZoom } : {}),
          ...(bounds ? { bounds } : {}),
          ...(overlay || clearBackground ? { backgroundColor: undefined } : {}),
        }) as unknown as Layer & { backgroundColor?: string };

        if (overlay || clearBackground) {
          layer.backgroundColor = undefined;
        }
        layer.addTo(map);
        onReady?.();
      })
      .catch((err) => {
        console.error("[BasemapLayers] native pmtiles failed", file, err);
        onError?.(err);
      });

    return () => {
      cancelled = true;
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, file, maxZoom, maxDataZoom, minZoom, bounds, overlay, clearBackground, onReady, onError]);

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
  online: boolean;
  topoOn: boolean;
}

/**
 * Website: OSM / OpenTopoMap.
 *
 * Native APK: basemap.pmtiles (z0–14) via Capacitor PmtilesAsset plugin
 * (direct AssetFileDescriptor reads — NOT WebView HTTP Range). Continuous
 * zoom-in/out. OSM underlay when online as safety net outside the corridor.
 */
export default function BasemapLayers({ online, topoOn }: BasemapLayersProps) {
  const [packedFailed, setPackedFailed] = useState(false);

  if (!IS_NATIVE) {
    return <OnlineOsmBasemap topoOn={topoOn} />;
  }

  // If native archive cannot open, fall back to OSM while online.
  if (packedFailed && online) {
    return <OnlineOsmBasemap topoOn={topoOn} />;
  }

  return (
    <>
      {online && (
        <TileLayer attribution={OSM_ATTR} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      )}
      <ProtomapsNativeLayer
        file="basemap.pmtiles"
        minZoom={0}
        maxZoom={18}
        maxDataZoom={14}
        clearBackground={online}
        onError={() => setPackedFailed(true)}
      />
      {topoOn && !packedFailed && (
        <ProtomapsNativeLayer
          file="hike.pmtiles"
          minZoom={10}
          maxZoom={18}
          maxDataZoom={16}
          bounds={HIKE_BOUNDS}
          overlay
        />
      )}
    </>
  );
}
