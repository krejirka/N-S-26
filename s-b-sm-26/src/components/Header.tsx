import type { Itinerary, PlacesData, RoutesData, TripDay } from "@/types/trip";
import DayNav from "@/components/DayNav";
import IronknotLogo from "@/components/IronknotLogo";
import { dayRoadDistanceKm } from "@/lib/dayDistance";
import { IS_NATIVE } from "@/lib/runtime";

interface HeaderProps {
  itinerary: Itinerary;
  routes: RoutesData;
  daySegments: PlacesData["daySegments"];
  day: TripDay;
  showDates: boolean;
  hasPrevDay: boolean;
  hasNextDay: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  fullRouteLocked: boolean;
  onToggleFullRoute: () => void;
}

export default function Header({
  itinerary,
  routes,
  daySegments,
  day,
  showDates,
  hasPrevDay,
  hasNextDay,
  onPrevDay,
  onNextDay,
  fullRouteLocked,
  onToggleFullRoute,
}: HeaderProps) {
  const { meta } = itinerary;
  const roadKm = dayRoadDistanceKm(day, routes.segments, daySegments);

  return (
    <header className="bg-card px-4 py-2 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 md:flex-row md:items-center md:gap-6 lg:gap-8">
        <div className="flex shrink-0 items-center gap-3">
          <IronknotLogo size="header" surface="light" />
          <div className="shrink-0">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              {IS_NATIVE ? (
                <span>Cestovní plán</span>
              ) : (
                <a href="/" className="hover:underline">
                  Cestovní plán
                </a>
              )}
              <span className="ml-2 font-normal normal-case text-muted-foreground">
                · {meta.totalDays} dní / {routes.totalDistanceKm.toLocaleString("cs-CZ")} km
              </span>
            </p>
            <h1 className="mt-0.5 whitespace-nowrap text-lg font-extrabold tracking-tight lg:text-xl">
              {meta.title}
            </h1>
            <p className="text-xs text-muted-foreground lg:text-sm">{meta.highlights.join(" · ")}</p>
          </div>
        </div>

        <DayNav
          day={day}
          showDates={showDates}
          hasPrev={hasPrevDay}
          hasNext={hasNextDay}
          onPrev={onPrevDay}
          onNext={onNextDay}
          fullRouteLocked={fullRouteLocked}
          onToggleFullRoute={onToggleFullRoute}
          roadKm={roadKm}
        />
      </div>
    </header>
  );
}
