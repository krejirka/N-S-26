import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { leafletLayer } from "protomaps-leaflet";
import { IS_NATIVE } from "@/lib/runtime";
import { offlineAssetUrl } from "@/lib/pmtilesMemory";

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function ProtomapsFileLayer({ file, maxZoom }: { file: string; maxZoom: number }) {
  const map = useMap();

  useEffect(() => {
    const layer = leafletLayer({
      url: offlineAssetUrl(file),
      flavor: "light",
      lang: "cs",
      attribution: OSM_ATTR + " · Protomaps",
      maxZoom,
      maxDataZoom: file.includes("hike") ? 15 : 12,
    }) as unknown as Layer;
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, file, maxZoom]);

  return null;
}

interface BasemapLayersProps {
  online: boolean;
  topoOn: boolean;
}

export default function BasemapLayers({ online, topoOn }: BasemapLayersProps) {
  const usePacked = IS_NATIVE && !online;
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
      <ProtomapsFileLayer file="corridor.pmtiles" maxZoom={topoOn ? 13 : 14} />
      {topoOn && <ProtomapsFileLayer file="hike.pmtiles" maxZoom={16} />}
      {topoOn && (
        <TileLayer
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
          url={otmUrl}
          maxNativeZoom={16}
          maxZoom={18}
          opacity={0.92}
        />
      )}
    </>
  );
}
