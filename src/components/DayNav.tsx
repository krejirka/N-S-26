import { ChevronLeft, ChevronRight, Tent, Home, Ship } from "lucide-react";
import type { TripDay } from "@/types/trip";

interface DayNavProps {
  day: TripDay;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function formatDate(date: string, weekday: string) {
  const formatted = new Date(date + "T12:00:00").toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(weekday, weekday);
}

function LodgingIcon({ lodging }: { lodging: string }) {
  if (/stan/i.test(lodging)) return <Tent className="h-3.5 w-3.5" />;
  if (/trajekt/i.test(lodging)) return <Ship className="h-3.5 w-3.5" />;
  return <Home className="h-3.5 w-3.5" />;
}

export default function DayNav({ day, hasPrev, hasNext, onPrev, onNext }: DayNavProps) {
  return (
    <div className="w-full min-w-0 md:max-w-2xl md:flex-1">
      <div className="flex w-full items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Předchozí den"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Předchozí</span>
        </button>

        <div className="min-w-0 flex-1 px-1 text-center sm:px-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Den {day.day}</p>
          <h3 className="text-base font-bold leading-tight sm:text-lg md:text-xl">{day.destination}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{formatDate(day.date, day.weekday)}</p>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Další den"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
        >
          <span className="hidden sm:inline">Další</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {(day.km != null || day.lodging || day.logistics) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm md:pr-0">
          {day.km != null && <span className="rounded-full bg-muted px-2.5 py-1">{day.km} km</span>}
          {day.lodging && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 capitalize">
              <LodgingIcon lodging={day.lodging} />
              {day.lodging}
            </span>
          )}
          {day.logistics && (
            <span className="max-w-full rounded-full bg-muted px-2.5 py-1 sm:truncate">{day.logistics}</span>
          )}
        </div>
      )}

      {day.program && (
        <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm md:line-clamp-3 lg:line-clamp-none">
          {day.program}
        </p>
      )}
    </div>
  );
}
