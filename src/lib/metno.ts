export const MET_USER_AGENT = "n-s-26.ironknot.cz/1.0 github.com/krejirka/N-S-26";

export interface DayForecast {
  date: string;
  label: string;
  symbol: string;
  tempDay: number;
  tempNight: number;
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
    next_6_hours?: {
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
const FORECAST_DAYS = 5;

export function weatherIconUrl(symbol: string) {
  return `https://cdn.jsdelivr.net/gh/metno/weathericons@main/weather/svg/${symbol}.svg`;
}

function hourUtc(time: string) {
  return parseInt(time.slice(11, 13), 10);
}

function isNightHour(h: number) {
  return h <= 6 || h >= 22;
}

function isDayHour(h: number) {
  return h >= 9 && h <= 18;
}

export function parseFiveDayForecast(data: MetForecastResponse): DayForecast[] {
  const series = data.properties?.timeseries ?? [];
  const byDate = new Map<
    string,
    {
      dayTemps: number[];
      nightTemps: number[];
      wind: number[];
      precip: number;
      symbol: string;
    }
  >();

  for (const entry of series) {
    const date = entry.time.slice(0, 10);
    const hour = hourUtc(entry.time);
    const temp = entry.data.instant?.details?.air_temperature;
    const wind = entry.data.instant?.details?.wind_speed;
    const precip = entry.data.next_1_hours?.details?.precipitation_amount ?? 0;
    const symbol =
      entry.data.next_12_hours?.summary?.symbol_code ??
      entry.data.next_6_hours?.summary?.symbol_code ??
      entry.data.next_1_hours?.summary?.symbol_code ??
      "cloudy";

    if (!byDate.has(date)) {
      byDate.set(date, { dayTemps: [], nightTemps: [], wind: [], precip: 0, symbol });
    }
    const bucket = byDate.get(date)!;
    if (temp != null) {
      if (isDayHour(hour)) bucket.dayTemps.push(temp);
      if (isNightHour(hour)) bucket.nightTemps.push(temp);
    }
    if (wind != null) bucket.wind.push(wind);
    bucket.precip += precip;
    if (hour === 12) bucket.symbol = symbol;
  }

  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.slice(0, FORECAST_DAYS).map(([date, bucket]) => {
    const allTemps = [...bucket.dayTemps, ...bucket.nightTemps];
    const dayTemps = bucket.dayTemps.length ? bucket.dayTemps : allTemps;
    const nightTemps = bucket.nightTemps.length ? bucket.nightTemps : allTemps;
    const wind = bucket.wind.length ? bucket.wind : [0];
    const d = new Date(date + "T12:00:00");

    return {
      date,
      label: d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" }),
      symbol: bucket.symbol,
      tempDay: Math.round(Math.max(...dayTemps)),
      tempNight: Math.round(Math.min(...nightTemps)),
      precipMm: Math.round(bucket.precip * 10) / 10,
      windMax: Math.round(Math.max(...wind) * 10) / 10,
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
  const days = parseFiveDayForecast(data);
  forecastCache.set(key, { at: Date.now(), data: days });
  return days;
}
