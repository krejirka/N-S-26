import { useEffect, useState } from "react";
import { fetchYrForecast, weatherIconUrl, type DayForecast } from "@/lib/metno";

interface YrForecastProps {
  lat: number;
  lng: number;
}

function formatPrecip(mm: number) {
  if (mm <= 0) return "bez srážek";
  return `${mm} mm`;
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
        Předpověď 5 dní ·{" "}
        <a href="https://www.yr.no/" target="_blank" rel="noopener noreferrer" className="underline">
          yr.no
        </a>
      </p>
      <ul className="space-y-2.5">
        {days.map((day) => (
          <li key={day.date} className="flex items-start gap-2 text-xs">
            <img src={weatherIconUrl(day.symbol)} alt="" className="mt-0.5 h-6 w-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-medium capitalize text-foreground">{day.label}</span>
              <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 tabular-nums text-muted-foreground">
                <span>
                  den <span className="text-foreground">{day.tempDay} °C</span>
                </span>
                <span>
                  noc <span className="text-foreground">{day.tempNight} °C</span>
                </span>
                <span className={day.precipMm > 0 ? "text-blue-700" : ""}>{formatPrecip(day.precipMm)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
