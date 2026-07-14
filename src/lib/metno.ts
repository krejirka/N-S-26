export const MET_USER_AGENT = "n-s-26.ironknot.cz/1.0 github.com/krejirka/N-S-26";

export interface DayForecast {
  date: string;
  label: string;
  symbol: string;
  tempDay: number;
  tempNight: number;
  precipMm: number;
  precipLabel: string;
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

function isPrecipSymbol(symbol: string) {
  return /rain|shower|sleet|snow|thunder|drizzle/i.test(symbol);
}

function precipTypeFromSymbol(symbol: string): string | null {
  const s = symbol.toLowerCase();
  if (/thunder/.test(s)) return "bouřky";
  if (/heavyrainshowers|heavyrain_shower/.test(s)) return "silné přeháňky";
  if (/rainshowers|rain_shower/.test(s)) return "přeháňky";
  if (/lightrainshowers|lightrain_shower/.test(s)) return "slabé přeháňky";
  if (/heavyrain/.test(s)) return "vytrvalý silný déšť";
  if (/lightrain/.test(s)) return "slabý déšť";
  if (/rain/.test(s)) return "vytrvalý déšť";
  if (/sleet/.test(s)) return "déšť se sněhem";
  if (/snow/.test(s)) return "sněžení";
  if (/drizzle/.test(s)) return "mrholení";
  return null;
}

const PRECIP_TYPE_RANK: Record<string, number> = {
  bouřky: 7,
  "silné přeháňky": 6,
  "vytrvalý silný déšť": 6,
  přeháňky: 5,
  "slabé přeháňky": 4,
  "vytrvalý déšť": 4,
  "slabý déšť": 3,
  mrholení: 2,
  "déšť se sněhem": 3,
  sněžení: 3,
};

function dominantPrecipType(symbols: string[]): string | null {
  let best: string | null = null;
  let bestRank = 0;
  for (const symbol of symbols) {
    const type = precipTypeFromSymbol(symbol);
    if (!type) continue;
    const rank = PRECIP_TYPE_RANK[type] ?? 1;
    if (rank > bestRank) {
      best = type;
      bestRank = rank;
    }
  }
  return best;
}

export function formatPrecipLabel(mm: number, precipSymbols: string[]): string {
  const type = dominantPrecipType(precipSymbols);

  if (mm >= 0.1) {
    const mmText =
      mm < 0.5 ? "do 1 mm" : mm < 10 ? `cca ${Math.round(mm * 10) / 10} mm` : `cca ${Math.round(mm)} mm`;
    return type ? `${mmText} · ${type}` : mmText;
  }

  if (type) {
    return `možné srážky · ${type}`;
  }

  return "bez srážek";
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
      precipSymbols: string[];
      symbol: string;
      coveredUntilHour: number;
    }
  >();

  for (const entry of series) {
    const date = entry.time.slice(0, 10);
    const hour = hourUtc(entry.time);
    const temp = entry.data.instant?.details?.air_temperature;
    const wind = entry.data.instant?.details?.wind_speed;
    const precip6 = entry.data.next_6_hours?.details?.precipitation_amount;
    const precip1 = entry.data.next_1_hours?.details?.precipitation_amount;
    const symbol =
      entry.data.next_12_hours?.summary?.symbol_code ??
      entry.data.next_6_hours?.summary?.symbol_code ??
      entry.data.next_1_hours?.summary?.symbol_code ??
      "cloudy";

    if (!byDate.has(date)) {
      byDate.set(date, {
        dayTemps: [],
        nightTemps: [],
        wind: [],
        precip: 0,
        precipSymbols: [],
        symbol,
        coveredUntilHour: -1,
      });
    }
    const bucket = byDate.get(date)!;

    if (temp != null) {
      if (isDayHour(hour)) bucket.dayTemps.push(temp);
      if (isNightHour(hour)) bucket.nightTemps.push(temp);
    }
    if (wind != null) bucket.wind.push(wind);

    if (hour % 6 === 0 && precip6 != null) {
      bucket.precip += precip6;
      bucket.coveredUntilHour = hour + 6;
      const sym6 = entry.data.next_6_hours?.summary?.symbol_code;
      if (sym6 && isPrecipSymbol(sym6)) bucket.precipSymbols.push(sym6);
    } else if (hour >= bucket.coveredUntilHour && precip1 != null) {
      bucket.precip += precip1;
      const sym1 = entry.data.next_1_hours?.summary?.symbol_code;
      if (sym1 && isPrecipSymbol(sym1)) bucket.precipSymbols.push(sym1);
    }

    if (hour === 12) bucket.symbol = symbol;
    else if (isPrecipSymbol(symbol) && !bucket.precipSymbols.includes(symbol)) {
      bucket.precipSymbols.push(symbol);
    }
  }

  // Timeseries begins with trailing hours of the previous UTC day; start from today (local).
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const sorted = [...byDate.entries()]
    .filter(([date]) => date >= todayLocal)
    .sort(([a], [b]) => a.localeCompare(b));
  return sorted.slice(0, FORECAST_DAYS).map(([date, bucket]) => {
    const allTemps = [...bucket.dayTemps, ...bucket.nightTemps];
    const dayTemps = bucket.dayTemps.length ? bucket.dayTemps : allTemps;
    const nightTemps = bucket.nightTemps.length ? bucket.nightTemps : allTemps;
    const wind = bucket.wind.length ? bucket.wind : [0];
    const d = new Date(date + "T12:00:00");

    const precipMm = Math.round(bucket.precip * 10) / 10;

    return {
      date,
      label: d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" }),
      symbol: bucket.symbol,
      tempDay: Math.round(Math.max(...dayTemps)),
      tempNight: Math.round(Math.min(...nightTemps)),
      precipMm,
      precipLabel: formatPrecipLabel(precipMm, bucket.precipSymbols),
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
