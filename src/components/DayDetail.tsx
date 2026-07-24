import PlaceCard from "./PlaceCard";
import YrForecast from "./YrForecast";
import NavigateButton from "./NavigateButton";
import DayServicesPanel from "./DayServicesPanel";
import { useDayTraffic } from "@/hooks/useDayTraffic";
import type { DayIncidentsSummary } from "@/hooks/useDayIncidents";
import { formatDayKm } from "@/lib/dayDistance";
import type {
  CorridorPoi,
  FishingSpot,
  Place,
  PlacesData,
  RouteSegment,
  TripDay,
} from "@/types/trip";

interface DayDetailProps {
  day: TripDay;
  placeCoords: Place | null;
  places: PlacesData["places"];
  segments: RouteSegment[];
  daySegments: Record<string, string[]>;
  incidents?: DayIncidentsSummary;
  corridorPois: CorridorPoi[];
  fishingSpots: FishingSpot[];
}

export default function DayDetail({
  day,
  placeCoords,
  places,
  segments,
  daySegments,
  incidents,
  corridorPois,
  fishingSpots,
}: DayDetailProps) {
  const travel = useDayTraffic(day, places, segments, daySegments);
  const destLabel = placeCoords?.name || day.destination;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-5">
        {placeCoords && (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <NavigateButton lat={placeCoords.lat} lng={placeCoords.lng} label={destLabel}>
              Navigovat na cíl dne
            </NavigateButton>
            <div className="text-sm text-muted-foreground">
              {travel.distanceKm > 0 ? (
                <>
                  <span className="font-medium text-foreground">{formatDayKm(travel.distanceKm)} km</span>
                  {" · "}
                  <span>~{travel.hoursLabel}</span>
                  <span className="text-xs"> (max {110} km/h)</span>
                  {travel.loading ? (
                    <span className="ml-1 text-xs">· načítám provoz…</span>
                  ) : travel.delayLabel ? (
                    <span className="ml-1 text-xs">· {travel.delayLabel}</span>
                  ) : null}
                  {incidents?.loading ? (
                    <span className="ml-1 text-xs">· stavby…</span>
                  ) : incidents?.liveIncidents && incidents.roadworksCount > 0 ? (
                    <span className="ml-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      · {incidents.roadworksCount}× stavební práce na mapě
                    </span>
                  ) : incidents?.liveIncidents &&
                    (incidents.closedCount > 0 || incidents.accidentCount > 0) ? (
                    <span className="ml-1 text-xs">
                      · {incidents.closedCount + incidents.accidentCount}× uzavírka/nehoda na mapě
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-xs">Bez silničního přejezdu dnes</span>
              )}
            </div>
          </div>
        )}

        <DayServicesPanel
          day={day}
          segments={segments}
          daySegments={daySegments}
          corridorPois={corridorPois}
          fishingSpots={fishingSpots}
        />

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
