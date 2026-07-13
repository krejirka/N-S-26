export interface RadarFrame {
  time: number;
  tileUrl: string;
  kind: "past" | "nowcast";
}

let framesCache: { at: number; data: RadarFrame[] } | null = null;

function buildTileUrl(host: string, path: string) {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}

export async function fetchRadarFrames(): Promise<RadarFrame[]> {
  if (framesCache && Date.now() - framesCache.at < 5 * 60 * 1000) {
    return framesCache.data;
  }

  const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
  if (!res.ok) throw new Error("Radar nedostupný");

  const json = (await res.json()) as {
    host: string;
    radar: {
      past: { time: number; path: string }[];
      nowcast?: { time: number; path: string }[];
    };
  };

  const past: RadarFrame[] = json.radar.past.map((f) => ({
    time: f.time,
    tileUrl: buildTileUrl(json.host, f.path),
    kind: "past",
  }));

  const nowcast: RadarFrame[] = (json.radar.nowcast ?? []).map((f) => ({
    time: f.time,
    tileUrl: buildTileUrl(json.host, f.path),
    kind: "nowcast",
  }));

  const frames = [...past, ...nowcast];
  if (!frames.length) throw new Error("Žádná radarová data");

  framesCache = { at: Date.now(), data: frames };
  return frames;
}

/** Reference = latest observed (past) frame — offset 0 = „teď“. */
export function getRadarReferenceTime(frames: RadarFrame[]) {
  const past = frames.filter((f) => f.kind === "past");
  return past[past.length - 1]?.time ?? frames[frames.length - 1].time;
}

export function formatRadarOffsetMinutes(frameTime: number, referenceTime: number) {
  const diffMin = Math.round((frameTime - referenceTime) / 60);
  if (diffMin === 0) return "teď";
  if (diffMin > 0) return `+${diffMin} min`;
  return `${diffMin} min`;
}

export function formatRadarClock(time: number) {
  return new Date(time * 1000).toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRadarSliceIndices(frames: RadarFrame[]) {
  let historyEnd = -1;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].kind === "past") historyEnd = i;
  }

  const referenceTime =
    historyEnd >= 0 ? frames[historyEnd].time : frames[frames.length - 1]?.time ?? 0;

  let forecastEnd = historyEnd >= 0 ? historyEnd : 0;
  for (let i = historyEnd + 1; i < frames.length; i++) {
    const offsetMin = (frames[i].time - referenceTime) / 60;
    if (offsetMin > 0 && offsetMin <= 60) forecastEnd = i;
    else if (offsetMin > 60) break;
  }

  return {
    referenceTime,
    historyStart: 0,
    historyEnd: Math.max(historyEnd, 0),
    forecastStart: Math.max(historyEnd, 0),
    forecastEnd,
    hasForecast: forecastEnd > historyEnd,
  };
}
