import { TileLayer } from "react-leaflet";

interface RadarPrecipitationLayerProps {
  tileUrl: string;
  opacity?: number;
}

export default function RadarPrecipitationLayer({ tileUrl, opacity = 0.5 }: RadarPrecipitationLayerProps) {
  return (
    <TileLayer
      key={tileUrl}
      url={tileUrl}
      opacity={opacity}
      zIndex={250}
      maxZoom={7}
      maxNativeZoom={7}
      attribution='Radar <a href="https://www.rainviewer.com/">RainViewer</a> · predikce <a href="https://librewxr.net/">LibreWXR</a>'
    />
  );
}
