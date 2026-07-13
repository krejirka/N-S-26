import PlaceCard from "./PlaceCard";
import YrForecast from "./YrForecast";
import type { Place, TripDay } from "@/types/trip";

interface DayDetailProps {
  day: TripDay;
  placeCoords: Place | null;
}

export default function DayDetail({ day, placeCoords }: DayDetailProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-5">
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
