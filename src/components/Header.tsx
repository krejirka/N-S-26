import type { Itinerary, RoutesData } from "@/types/trip";

interface HeaderProps {
  itinerary: Itinerary;
  routes: RoutesData;
}

export default function Header({ itinerary, routes }: HeaderProps) {
  const { meta } = itinerary;

  return (
    <header className="bg-card px-4 py-2 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1920px]">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Cestovní plán
          <span className="ml-2 font-normal normal-case text-muted-foreground">
            · {meta.totalDays} dní / {routes.totalDistanceKm.toLocaleString("cs-CZ")} km
          </span>
        </p>
        <h1 className="mt-0.5 truncate text-xl font-extrabold tracking-tight lg:text-2xl">{meta.title}</h1>
        <p className="truncate text-xs text-muted-foreground lg:text-sm">{meta.highlights.join(" · ")}</p>
      </div>
    </header>
  );
}
