import { ChevronLeft, ChevronRight, Map, Tent, Home, Ship } from "lucide-react";
import type { TripDay } from "@/types/trip";
import { formatDayKm } from "@/lib/dayDistance";
import { APK_DOWNLOAD_HREF, APK_FILE_NAME, APK_ICON_SRC, APK_VERSION, IS_NATIVE } from "@/lib/runtime";

interface DayNavProps {
  day: TripDay;
  showDates: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Full-route map overview locked (zoom to entire trip). */
  fullRouteLocked: boolean;
  onToggleFullRoute: () => void;
  /** OSRM silniční km (má přednost před day.km) */
  roadKm?: number | null;
}

function formatDayLabel(date: string) {
  const formatted = new Date(date + "T12:00:00").toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function LodgingIcon({ lodging }: { lodging: string }) {
  if (/stan/i.test(lodging)) return <Tent className="h-3.5 w-3.5 shrink-0" />;
  if (/trajekt/i.test(lodging)) return <Ship className="h-3.5 w-3.5 shrink-0" />;
  return <Home className="h-3.5 w-3.5 shrink-0" />;
}

export default function DayNav({
  day,
  showDates,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  fullRouteLocked,
  onToggleFullRoute,
  roadKm,
}: DayNavProps) {
  const kmLabel = formatDayKm(roadKm ?? day.km);

  return (
    <div className="flex w-full min-w-0 flex-1 items-start gap-3 lg:gap-4">
      <div className="min-w-0 flex-1 px-2 text-center sm:px-4">
        <p className="text-sm font-bold uppercase tracking-wide text-foreground sm:text-base lg:text-lg">
          Den {day.day}{" "}
          <span className="font-semibold normal-case">
            {showDates ? `(${formatDayLabel(day.date)})` : `– ${day.weekday}`}
          </span>
        </p>
        <h3 className="truncate text-base font-bold leading-tight text-foreground lg:text-lg xl:text-xl">
          {day.destination}
        </h3>

        {(kmLabel || day.lodging || day.logistics) && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs lg:text-sm">
            {kmLabel && (
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5">{kmLabel} km</span>
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

      <div className="flex shrink-0 items-center gap-1.5 self-center sm:gap-2">
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
          onClick={onToggleFullRoute}
          aria-label={fullRouteLocked ? "Zpět na detail dne" : "Zobrazit celou trasu"}
          aria-pressed={fullRouteLocked}
          title={fullRouteLocked ? "Odemknout — detail dne" : "Zamknout — celá trasa"}
          className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-sm font-medium transition lg:px-3 lg:py-2 ${
            fullRouteLocked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          <Map className="h-4 w-4" />
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
        {!IS_NATIVE && (
          <a
            href={APK_DOWNLOAD_HREF}
            download={APK_FILE_NAME}
            title={`Stáhnout Android APK ${APK_VERSION} (offline mapa trasy a treku)`}
            aria-label={`Stáhnout Android APK ${APK_VERSION}`}
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-600 bg-black hover:ring-2 hover:ring-primary/40 lg:h-[38px] lg:w-[38px]"
          >
            <img src={APK_ICON_SRC} alt="" className="h-full w-full object-cover" />
          </a>
        )}
      </div>
    </div>
  );
}
