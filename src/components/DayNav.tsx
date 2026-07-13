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
    <div className="w-full min-w-0 flex-1">
      <div className="flex w-full items-center gap-2 lg:gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Předchozí den"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-40 lg:px-3 lg:py-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden lg:inline">Předchozí</span>
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Den {day.day}{" "}
            <span className="normal-case">({formatDayLabel(day.date, day.weekday)})</span>
          </p>
          <h3 className="truncate text-base font-bold leading-tight lg:text-lg xl:text-xl">{day.destination}</h3>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Další den"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-40 lg:px-3 lg:py-2"
        >
          <span className="hidden lg:inline">Další</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {(day.km != null || day.lodging || day.logistics) && (
        <div className="mt-1.5 flex flex-nowrap items-center justify-center gap-2 overflow-hidden text-xs lg:text-sm">
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
            <span className="min-w-0 truncate rounded-full bg-muted px-2.5 py-0.5">{day.logistics}</span>
          )}
        </div>
      )}
    </div>
  );
}
