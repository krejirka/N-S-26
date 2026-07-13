export const MET_USER_AGENT = "n-s-26.ironknot.cz/1.0 github.com/krejirka/N-S-26";

export interface DayForecast {
  date: string;
  label: string;
  symbol: string;
  tempMin: number;
  tempMax: number;
  precipMm: number;
  windMax: number;
}

interface MetTimeseries {
  time: string;
  data: {
    instant?: { details?: { air_temperature?: number; wind_speed?: number } };
    next_1_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
    next_12_hours?: { summary?: { symbol_code?: string } };
  };
}

interface MetForecastResponse {
  properties?: { timeseries?: MetTimeseries[] };
}

const forecastCache = new Map<string, { at: number; data: DayForecast[] }>();
const CACHE_MS = 10 * 60 * 1000;

export function weatherIconUrl(symbol: string) {
  return `https://cdn.jsdelivr.net/gh/metno/weathericons@main/weather/svg/${symbol}.svg`;
}

export function parseThreeDayForecast(data: MetForecastResponse): DayForecast[] {
  const series = data.properties?.timeseries ?? [];
  const byDate = new Map<
    string,
    { temps: number[]; wind: number[]; precip: number; symbol: string }
  >();

  for (const entry of series) {
    const date = entry.time.slice(0, 10);
    const temp = entry.data.instant?.details?.air_temperature;
    const wind = entry.data.instant?.details?.wind_speed;
    const precip = entry.data.next_1_hours?.details?.precipitation_amount ?? 0;
    const symbol =
      entry.data.next_12_hours?.summary?.symbol_code ??
      entry.data.next_1_hours?.summary?.symbol_code ??
      "cloudy";

    if (!byDate.has(date)) {
      byDate.set(date, { temps: [], wind: [], precip: 0, symbol });
    }
    const bucket = byDate.get(date)!;
    if (temp != null) bucket.temps.push(temp);
    if (wind != null) bucket.wind.push(wind);
    bucket.precip += precip;
    if (entry.time.includes("T12:00:00")) bucket.symbol = symbol;
  }

  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.slice(0, 3).map(([date, bucket]) => {
    const d = new Date(date + "T12:00:00");
    return {
      date,
      label: d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" }),
      symbol: bucket.symbol,
      tempMin: Math.round(Math.min(...bucket.temps)),
      tempMax: Math.round(Math.max(...bucket.temps)),
      precipMm: Math.round(bucket.precip * 10) / 10,
      windMax: Math.round(Math.max(...bucket.wind, 0) * 10) / 10,
    };
  });
}

export async function fetchYrForecast(lat: number, lng: number): Promise<DayForecast[]> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = forecastCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const res = await fetch(`/api/forecast?lat=${lat}&lon=${lng}`);
  if (!res.ok) throw new Error(`Předpověď nedostupná (${res.status})`);

  const data = (await res.json()) as MetForecastResponse;
  const days = parseThreeDayForecast(data);
  forecastCache.set(key, { at: Date.now(), data: days });
  return days;
}

export interface YrMapLayerMeta {
  tileUrl: string;
  bounds: [[number, number], [number, number]];
  maxZoom: number;
  updatedAt: string;
}

let precipMetaCache: { at: number; data: YrMapLayerMeta } | null = null;

export async function fetchPrecipitationOverlay(): Promise<YrMapLayerMeta> {
  if (precipMetaCache && Date.now() - precipMetaCache.at < 5 * 60 * 1000) {
    return precipMetaCache.data;
  }

  const res = await fetch("https://beta.yr-maps.met.no/api/precipitation-nowcast/available.json");
  if (!res.ok) throw new Error("Vrstva srážek yr.no nedostupná");

  const json = (await res.json()) as {
    bounds: [number, number, number, number];
    maxzoom: number;
    times: { time: string; tiles: { png: string } }[];
  };

  const latest = json.times[json.times.length - 1] ?? json.times[0];
  if (!latest) throw new Error("Žádná data srážek");

  const [west, south, east, north] = json.bounds;
  const data: YrMapLayerMeta = {
    tileUrl: latest.tiles.png,
    bounds: [
      [south, west],
      [north, east],
    ],
    maxZoom: json.maxzoom,
    updatedAt: latest.time,
  };
  precipMetaCache = { at: Date.now(), data };
  return data;
}
