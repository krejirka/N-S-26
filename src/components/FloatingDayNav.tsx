import { ChevronLeft, ChevronRight, Tent, Home, Ship } from "lucide-react";
import type { TripDay } from "@/types/trip";

interface FloatingDayNavProps {
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
  if (/stan/i.test(lodging)) return <Tent className="h-3 w-3" />;
  if (/trajekt/i.test(lodging)) return <Ship className="h-3 w-3" />;
  return <Home className="h-3 w-3" />;
}

export default function FloatingDayNav({ day, hasPrev, hasNext, onPrev, onNext }: FloatingDayNavProps) {
  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-[1000] sm:inset-x-3">
      <div className="pointer-events-auto rounded-xl border border-border bg-card/95 px-2 py-2 shadow-lg backdrop-blur-sm sm:px-3 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Předchozí den"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 sm:px-2.5 sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden md:inline">Předchozí</span>
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Den {day.day}
            </p>
            <h3 className="truncate text-sm font-bold leading-tight sm:text-base">{day.destination}</h3>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              {formatDate(day.date, day.weekday)}
            </p>
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Další den"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 sm:px-2.5 sm:text-sm"
          >
            <span className="hidden md:inline">Další</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {(day.km != null || day.lodging || day.logistics) && (
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs">
            {day.km != null && (
              <span className="rounded-full bg-muted px-2 py-0.5">{day.km} km</span>
            )}
            {day.lodging && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 capitalize">
                <LodgingIcon lodging={day.lodging} />
                {day.lodging}
              </span>
            )}
            {day.logistics && (
              <span className="max-w-full truncate rounded-full bg-muted px-2 py-0.5">{day.logistics}</span>
            )}
          </div>
        )}

        {day.program && (
          <p className="mt-1.5 line-clamp-2 text-center text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {day.program}
          </p>
        )}
      </div>
    </div>
  );
}
