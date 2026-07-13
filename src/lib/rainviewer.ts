export interface RadarLayerMeta {
  tileUrl: string;
  updatedAt: number;
}

let cache: { at: number; data: RadarLayerMeta } | null = null;

export async function fetchRadarOverlay(): Promise<RadarLayerMeta> {
  if (cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.data;

  const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
  if (!res.ok) throw new Error("Radar nedostupný");

  const json = (await res.json()) as {
    host: string;
    radar: { past: { time: number; path: string }[] };
  };

  const latest = json.radar.past[json.radar.past.length - 1];
  if (!latest) throw new Error("Žádná radarová data");

  const data: RadarLayerMeta = {
    tileUrl: `${json.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
    updatedAt: latest.time,
  };
  cache = { at: Date.now(), data };
  return data;
}
