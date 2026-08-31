import type { Itinerary, PlacesData, RoutesData, TripDay } from "@/types/trip";
import DayNav from "@/components/DayNav";
import IronknotLogo from "@/components/IronknotLogo";
import { dayRoadDistanceKm } from "@/lib/dayDistance";
import { IS_NATIVE } from "@/lib/runtime";
import { useOnline } from "@/hooks/useOnline";

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
  logoPlayKey?: number;
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
  logoPlayKey = 0,
}: HeaderProps) {
  const { meta } = itinerary;
  const roadKm = dayRoadDistanceKm(day, routes.segments, daySegments);
  const online = useOnline();

  return (
    <header className="bg-card px-4 py-2 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 md:flex-row md:items-center md:gap-6 lg:gap-8">
        <div className={`flex items-center gap-3 ${IS_NATIVE ? "min-w-0" : "shrink-0"}`}>
          <IronknotLogo size="header" surface="light" playKey={logoPlayKey} />
          <div className={IS_NATIVE ? "min-w-0 flex-1" : "shrink-0"}>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium uppercase tracking-wide text-primary">
              {IS_NATIVE ? (
                <span>Cestovní plán</span>
              ) : (
                <a href="/" className="hover:underline">
                  Cestovní plán
                </a>
              )}
              <span className="font-normal normal-case text-muted-foreground">
                · {meta.totalDays} dní / {routes.totalDistanceKm.toLocaleString("cs-CZ")} km
              </span>
              {IS_NATIVE && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal ${
                    online
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-950"
                  }`}
                >
                  {online ? "Online" : "Offline"}
                </span>
              )}
            </p>
            <h1
              className={
                IS_NATIVE
                  ? "mt-0.5 text-[13px] font-extrabold leading-snug tracking-tight sm:text-sm"
                  : "mt-0.5 whitespace-nowrap text-lg font-extrabold tracking-tight lg:text-xl"
              }
            >
              {meta.title}
            </h1>
            <p className={`text-xs text-muted-foreground lg:text-sm ${IS_NATIVE ? "leading-snug" : ""}`}>
              {meta.highlights.join(" · ")}
            </p>
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
