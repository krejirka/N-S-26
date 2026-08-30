export interface RadarFrame {
  time: number;
  tileUrl: string;
  kind: "past" | "nowcast";
}

/** Max lookback for history animation (API usually supplies ~2 h; we take up to 4 h). */
export const RADAR_HISTORY_MINUTES = 240;
/** Max forecast / nowcast window. */
export const RADAR_FORECAST_MINUTES = 120;

let framesCache: { at: number; data: RadarFrame[] } | null = null;

function buildTileUrl(host: string, path: string) {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}

type MapsJson = {
  host: string;
  radar?: {
    past?: { time: number; path: string }[];
    nowcast?: { time: number; path: string }[];
  };
};

async function fetchMapsJson(url: string): Promise<MapsJson | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as MapsJson;
  } catch {
    return null;
  }
}

function mapFrames(
  host: string,
  list: { time: number; path: string }[] | undefined,
  kind: "past" | "nowcast"
): RadarFrame[] {
  return (list ?? []).map((f) => ({
    time: f.time,
    tileUrl: buildTileUrl(host, f.path),
    kind,
  }));
}

/** Prefer RainViewer past + LibreWXR nowcast (free RainViewer has no nowcast). */
export async function fetchRadarFrames(): Promise<RadarFrame[]> {
  if (framesCache && Date.now() - framesCache.at < 5 * 60 * 1000) {
    return framesCache.data;
  }

  const [rainviewer, librewxr] = await Promise.all([
    fetchMapsJson("https://api.rainviewer.com/public/weather-maps.json"),
    fetchMapsJson("https://api.librewxr.net/public/weather-maps.json"),
  ]);

  if (!rainviewer && !librewxr) throw new Error("Radar nedostupný");

  const rvPast = rainviewer ? mapFrames(rainviewer.host, rainviewer.radar?.past, "past") : [];
  const lxPast = librewxr ? mapFrames(librewxr.host, librewxr.radar?.past, "past") : [];
  const past = lxPast.length > rvPast.length ? lxPast : rvPast.length ? rvPast : lxPast;

  const lastPastTime = past[past.length - 1]?.time ?? 0;

  const rvNow = rainviewer
    ? mapFrames(rainviewer.host, rainviewer.radar?.nowcast, "nowcast").filter(
        (f) => f.time > lastPastTime
      )
    : [];
  const lxNow = librewxr
    ? mapFrames(librewxr.host, librewxr.radar?.nowcast, "nowcast").filter(
        (f) => f.time > lastPastTime
      )
    : [];
  const nowcast = lxNow.length >= rvNow.length ? lxNow : rvNow.length ? rvNow : lxNow;

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

  let historyStart = 0;
  if (historyEnd >= 0) {
    historyStart = historyEnd;
    for (let i = 0; i <= historyEnd; i++) {
      const offsetMin = (frames[i].time - referenceTime) / 60;
      if (offsetMin >= -RADAR_HISTORY_MINUTES) {
        historyStart = i;
        break;
      }
    }
  }

  let forecastEnd = historyEnd >= 0 ? historyEnd : 0;
  for (let i = historyEnd + 1; i < frames.length; i++) {
    const offsetMin = (frames[i].time - referenceTime) / 60;
    if (offsetMin > 0 && offsetMin <= RADAR_FORECAST_MINUTES) forecastEnd = i;
    else if (offsetMin > RADAR_FORECAST_MINUTES) break;
  }

  return {
    referenceTime,
    historyStart,
    historyEnd: Math.max(historyEnd, 0),
    forecastStart: Math.max(historyEnd, 0),
    forecastEnd,
    hasForecast: forecastEnd > historyEnd,
  };
}
