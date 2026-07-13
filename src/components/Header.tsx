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
    <header className="bg-card px-4 py-3 md:px-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:gap-x-8 lg:gap-x-12">
        <div className="min-w-0 shrink-0">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Cestovní plán
            <span className="ml-2 font-normal normal-case text-muted-foreground">
              · {meta.totalDays} dní / {routes.totalDistanceKm.toLocaleString("cs-CZ")} km
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.highlights.join(" · ")}</p>
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
