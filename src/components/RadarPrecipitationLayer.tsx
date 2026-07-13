import { useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";
import { fetchRadarOverlay } from "@/lib/rainviewer";

interface RadarPrecipitationLayerProps {
  visible: boolean;
  opacity?: number;
}

export default function RadarPrecipitationLayer({ visible, opacity = 0.45 }: RadarPrecipitationLayerProps) {
  const [layer, setLayer] = useState<Awaited<ReturnType<typeof fetchRadarOverlay>> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchRadarOverlay()
        .then((data) => {
          if (!cancelled) setLayer(data);
        })
        .catch(() => {
          if (!cancelled) setLayer(null);
        });
    };

    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!visible || !layer) return null;

  return (
    <TileLayer
      url={layer.tileUrl}
      opacity={opacity}
      zIndex={250}
      attribution='Radar <a href="https://www.rainviewer.com/">RainViewer</a>'
    />
  );
}
