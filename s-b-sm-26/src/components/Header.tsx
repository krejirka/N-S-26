import type { Itinerary, PlacesData, RoutesData, TripDay } from "@/types/trip";
import DayNav from "@/components/DayNav";
import IronknotLogo from "@/components/IronknotLogo";
import { dayRoadDistanceKm } from "@/lib/dayDistance";
import { HEADER_BAR_BG } from "@/lib/brand";
import { APP_VERSION, IS_NATIVE } from "@/lib/runtime";
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
    <header
      className="header-ironknot px-4 py-2 md:px-6 lg:px-8"
      style={{ background: HEADER_BAR_BG }}
    >
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 md:flex-row md:items-center md:gap-6 lg:gap-8">
        <div className="flex min-w-0 w-full items-center gap-3 md:w-auto md:max-w-[42%]">
          <IronknotLogo size="header" playKey={logoPlayKey} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-wide text-primary sm:text-sm">
              {IS_NATIVE ? (
                <span>Cestovní plán</span>
              ) : (
                <a href="/" className="hover:underline">
                  Cestovní plán
                </a>
              )}
              <span className="font-normal normal-case text-neutral-400">
                · {meta.totalDays} dní / {routes.totalDistanceKm.toLocaleString("cs-CZ")} km
              </span>
              <span className="rounded-full bg-neutral-500/20 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-neutral-300">
                v{APP_VERSION}
              </span>
              {IS_NATIVE && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal ${
                    online
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-400/20 text-amber-200"
                  }`}
                >
                  {online ? "Online" : "Offline"}
                </span>
              )}
            </p>
            <h1 className="mt-0.5 text-[13px] font-extrabold leading-snug tracking-tight text-neutral-50 sm:text-sm lg:text-lg xl:text-xl">
              {meta.title}
            </h1>
            <p className="text-xs leading-snug text-neutral-400 lg:text-sm">{meta.highlights.join(" · ")}</p>
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
