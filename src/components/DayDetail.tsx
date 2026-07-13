import { ChevronLeft, ChevronRight, Tent, Home, Ship } from "lucide-react";
import PlaceCard from "./PlaceCard";
import YrForecast from "./YrForecast";
import type { Place, TripDay } from "@/types/trip";

interface DayDetailProps {
  day: TripDay;
  placeCoords: Place | null;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function formatFullDate(date: string, weekday: string) {
  const d = new Date(date + "T12:00:00").toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return d.charAt(0).toUpperCase() + d.slice(1).replace(weekday, weekday);
}

function LodgingIcon({ lodging }: { lodging: string | null }) {
  if (!lodging) return null;
  if (/stan/i.test(lodging)) return <Tent className="h-4 w-4" />;
  if (/trajekt/i.test(lodging)) return <Ship className="h-4 w-4" />;
  return <Home className="h-4 w-4" />;
}

export default function DayDetail({ day, placeCoords, onPrev, onNext, hasPrev, hasNext }: DayDetailProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm disabled:opacity-40 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" /> Předchozí
        </button>
        <span className="text-sm font-medium text-muted-foreground">Den {day.day}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm disabled:opacity-40 hover:bg-muted"
        >
          Další <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{formatFullDate(day.date, day.weekday)}</p>
          <h2 className="mt-1 text-xl font-bold">{day.destination}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {day.km != null && (
              <span className="rounded-full bg-muted px-3 py-1">{day.km} km (plán)</span>
            )}
            {day.lodging && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 capitalize">
                <LodgingIcon lodging={day.lodging} />
                {day.lodging}
              </span>
            )}
          </div>
        </div>

        {day.logistics && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Logistika</h3>
            <p className="mt-2 text-sm leading-relaxed">{day.logistics}</p>
          </div>
        )}

        {day.program && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Program</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{day.program}</p>
          </div>
        )}

        {placeCoords && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <YrForecast lat={placeCoords.lat} lng={placeCoords.lng} />
          </div>
        )}

        {day.places.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Místa a tipy
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {day.places.map((place) => (
                <PlaceCard key={place.name} place={place} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
