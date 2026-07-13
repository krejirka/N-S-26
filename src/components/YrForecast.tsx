import { useEffect, useState } from "react";
import { fetchYrForecast, weatherIconUrl, type DayForecast } from "@/lib/metno";

interface YrForecastProps {
  lat: number;
  lng: number;
}

export default function YrForecast({ lat, lng }: YrForecastProps) {
  const [days, setDays] = useState<DayForecast[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchYrForecast(lat, lng)
      .then((data) => {
        if (!cancelled) setDays(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (loading) {
    return <p className="mt-2 text-xs text-gray-500">Načítám předpověď z yr.no…</p>;
  }

  if (error) {
    return <p className="mt-2 text-xs text-red-600">{error}</p>;
  }

  if (!days?.length) {
    return (
      <p className="mt-2 text-xs text-gray-500">
        Předpověď se nepodařilo načíst.{" "}
        <a
          href={`https://www.yr.no/en/forecast/daily-table/${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Otevřít na yr.no
        </a>
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Předpověď 3 dny ·{" "}
        <a href="https://www.yr.no/" target="_blank" rel="noopener noreferrer" className="underline">
          yr.no
        </a>
      </p>
      <ul className="space-y-2">
        {days.map((day) => (
          <li key={day.date} className="flex items-center gap-2 text-xs">
            <img src={weatherIconUrl(day.symbol)} alt="" className="h-7 w-7 shrink-0" />
            <span className="w-16 shrink-0 font-medium capitalize">{day.label}</span>
            <span className="tabular-nums text-gray-700">
              {day.tempMin}–{day.tempMax} °C
            </span>
            {day.precipMm > 0 && (
              <span className="text-blue-700">{day.precipMm} mm</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
