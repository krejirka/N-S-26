import PlaceCard from "./PlaceCard";
import YrForecast from "./YrForecast";
import { ExternalLink } from "lucide-react";
import { navigationUrl } from "@/lib/navLink";
import type { Place, TripDay } from "@/types/trip";

interface DayDetailProps {
  day: TripDay;
  placeCoords: Place | null;
}

export default function DayDetail({ day, placeCoords }: DayDetailProps) {
  const destNav =
    placeCoords != null ? navigationUrl(placeCoords.lat, placeCoords.lng, placeCoords.name || day.destination) : null;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-5">
        {destNav && (
          <div className="mb-4">
            <a
              href={destNav}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Navigovat na cíl dne
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {day.logistics && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Logistika</h3>
            <p className="mt-2 text-sm leading-relaxed">{day.logistics}</p>
          </div>
        )}

        {day.program && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Program</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{day.program}</p>
          </div>
        )}

        {placeCoords && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <YrForecast lat={placeCoords.lat} lng={placeCoords.lng} />
          </div>
        )}

        {day.places.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Místa a tipy
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {day.places.map((place) => (
                <PlaceCard key={place.name} place={place} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
