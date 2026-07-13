import { useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";
import { fetchPrecipitationOverlay } from "@/lib/metno";

export default function YrPrecipitationLayer() {
  const [layer, setLayer] = useState<Awaited<ReturnType<typeof fetchPrecipitationOverlay>> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchPrecipitationOverlay()
        .then((data) => {
          if (!cancelled) setLayer(data);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    };

    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (error || !layer) return null;

  return (
    <TileLayer
      url={layer.tileUrl}
      opacity={0.55}
      maxNativeZoom={layer.maxZoom}
      maxZoom={18}
      bounds={layer.bounds}
      attribution='Srážky <a href="https://www.yr.no/">yr.no</a> / MET'
    />
  );
}
