import { Route } from "lucide-react";
import type { Itinerary, RoutesData } from "@/types/trip";

interface HeaderProps {
  itinerary: Itinerary;
  routes: RoutesData;
}

export default function Header({ itinerary, routes }: HeaderProps) {
  const { meta } = itinerary;
  return (
    <header className="border-b border-border bg-card px-4 py-5 shadow-sm md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Cestovní plán</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.highlights.join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="rounded-lg bg-muted px-3 py-2">
            <span className="block text-xs text-muted-foreground">Dní</span>
            <span className="font-semibold">{meta.totalDays}</span>
          </div>
          <div className="rounded-lg bg-muted px-3 py-2">
            <span className="block text-xs text-muted-foreground">Vzdálenost (OSRM)</span>
            <span className="font-semibold">{routes.totalDistanceKm.toLocaleString("cs-CZ")} km</span>
          </div>
          <div className="rounded-lg bg-muted px-3 py-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Route className="h-3 w-3" /> Trasa
            </span>
            <span className="font-semibold">Po silnicích</span>
          </div>
        </div>
      </div>
    </header>
  );
}
