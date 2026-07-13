import { ChevronLeft, ChevronRight, Tent, Home, Ship } from "lucide-react";
import type { TripDay } from "@/types/trip";

interface DayNavProps {
  day: TripDay;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function formatDayLabel(date: string, weekday: string) {
  const formatted = new Date(date + "T12:00:00").toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return capitalized.replace(weekday, weekday);
}

function LodgingIcon({ lodging }: { lodging: string }) {
  if (/stan/i.test(lodging)) return <Tent className="h-3.5 w-3.5 shrink-0" />;
  if (/trajekt/i.test(lodging)) return <Ship className="h-3.5 w-3.5 shrink-0" />;
  return <Home className="h-3.5 w-3.5 shrink-0" />;
}

export default function DayNav({ day, hasPrev, hasNext, onPrev, onNext }: DayNavProps) {
  return (
    <div className="w-full min-w-[min(100vw-5rem,44rem)] rounded-lg border border-border bg-card/95 px-4 py-2 shadow-md backdrop-blur-sm">
      <p className="text-center text-sm font-bold uppercase tracking-wide text-foreground sm:text-base lg:text-lg">
        Den {day.day}{" "}
        <span className="font-semibold normal-case">({formatDayLabel(day.date, day.weekday)})</span>
      </p>

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="min-w-0 text-left">
          <h3 className="truncate text-sm font-bold leading-tight text-foreground sm:text-base lg:text-lg">
            {day.destination}
          </h3>

          {(day.km != null || day.lodging || day.logistics) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
              {day.km != null && (
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5">{day.km} km</span>
              )}
              {day.lodging && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 capitalize">
                  <LodgingIcon lodging={day.lodging} />
                  {day.lodging}
                </span>
              )}
              {day.logistics && (
                <span className="max-w-full truncate rounded-full bg-muted px-2.5 py-0.5">{day.logistics}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Předchozí den"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-40 lg:px-3 lg:py-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Předchozí</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Další den"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-40 lg:px-3 lg:py-2"
          >
            <span className="hidden sm:inline">Další</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
