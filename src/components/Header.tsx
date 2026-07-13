import type { Itinerary, RoutesData, TripDay } from "@/types/trip";
import DayNav from "@/components/DayNav";

interface HeaderProps {
  itinerary: Itinerary;
  routes: RoutesData;
  day: TripDay;
  hasPrevDay: boolean;
  hasNextDay: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export default function Header({
  itinerary,
  routes,
  day,
  hasPrevDay,
  hasNextDay,
  onPrevDay,
  onNextDay,
}: HeaderProps) {
  const { meta } = itinerary;

  return (
    <header className="bg-card px-4 py-2 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 md:flex-row md:items-center md:gap-6 lg:gap-8">
        <div className="min-w-0 shrink-0 md:max-w-[340px] lg:max-w-[380px]">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Cestovní plán
            <span className="ml-2 font-normal normal-case text-muted-foreground">
              · {meta.totalDays} dní / {routes.totalDistanceKm.toLocaleString("cs-CZ")} km
            </span>
          </p>
          <h1 className="mt-0.5 truncate text-xl font-extrabold tracking-tight lg:text-2xl">{meta.title}</h1>
          <p className="truncate text-xs text-muted-foreground lg:text-sm">{meta.highlights.join(" · ")}</p>
        </div>

        <DayNav
          day={day}
          hasPrev={hasPrevDay}
          hasNext={hasNextDay}
          onPrev={onPrevDay}
          onNext={onNextDay}
        />
      </div>
    </header>
  );
}
