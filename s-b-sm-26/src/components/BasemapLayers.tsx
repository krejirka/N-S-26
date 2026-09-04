import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { leafletLayer } from "protomaps-leaflet";
import { IS_NATIVE } from "@/lib/runtime";
import { offlineAssetUrl } from "@/lib/pmtilesMemory";

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function ProtomapsFileLayer({
  file,
  maxZoom,
  maxDataZoom,
}: {
  file: string;
  maxZoom: number;
  maxDataZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    const layer = leafletLayer({
      url: offlineAssetUrl(file),
      flavor: "light",
      lang: "cs",
      attribution: OSM_ATTR + " · Protomaps",
      maxZoom,
      maxDataZoom,
    }) as unknown as Layer;
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, file, maxZoom, maxDataZoom]);

  return null;
}

interface BasemapLayersProps {
  online: boolean;
  topoOn: boolean;
}

/**
 * Native APK always prefers packed basemap (works offline).
 * Online OSM is only used in the website build.
 */
export default function BasemapLayers({ online: _online, topoOn }: BasemapLayersProps) {
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
      {/* 100 km corridor overview */}
      <ProtomapsFileLayer file="corridor.pmtiles" maxZoom={topoOn ? 13 : 16} maxDataZoom={12} />
      {/* Street-level detail ~12 km from route (city navigation) */}
      {!topoOn && <ProtomapsFileLayer file="streets.pmtiles" maxZoom={17} maxDataZoom={14} />}
      {topoOn && <ProtomapsFileLayer file="hike.pmtiles" maxZoom={17} maxDataZoom={16} />}
      {/* OTM rasters are omitted from the APK (install size); hike.pmtiles covers the trek. */}
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
