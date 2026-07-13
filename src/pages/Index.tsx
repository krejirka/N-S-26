import { useMemo, useState } from "react";
import Header from "@/components/Header";
import DayList from "@/components/DayList";
import DayDetail from "@/components/DayDetail";
import TripMap from "@/components/TripMap";
import itineraryData from "@/data/itinerary.json";
import routesData from "@/data/routes.json";
import placesData from "@/data/places.json";
import type { Itinerary, PlacesData, RoutesData } from "@/types/trip";

const itinerary = itineraryData as Itinerary;
const routes = routesData as RoutesData;
const places = placesData as PlacesData;

export default function Index() {
  const [selectedDay, setSelectedDay] = useState(1);

  const currentDay = useMemo(
    () => itinerary.days.find((d) => d.day === selectedDay) ?? itinerary.days[0],
    [selectedDay]
  );

  const dayIndex = itinerary.days.findIndex((d) => d.day === selectedDay);
  const placeCoords = places.places[currentDay.placeId] ?? null;

  return (
    <div className="flex min-h-full flex-col">
      <Header itinerary={itinerary} routes={routes} />
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_380px]">
        <div className="max-h-[40vh] lg:max-h-none lg:min-h-[calc(100vh-120px)]">
          <DayList days={itinerary.days} selectedDay={selectedDay} onSelect={setSelectedDay} />
        </div>

        <div className="flex min-h-[320px] flex-col border-b border-border lg:min-h-[calc(100vh-120px)] lg:border-b-0 lg:border-r">
          <div className="border-b border-border bg-card px-4 py-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mapa trasy</h2>
            <p className="text-xs text-muted-foreground">Silnice dle OSRM · předpověď yr.no · radar volitelně</p>
          </div>
          <div className="min-h-[280px] flex-1">
            <TripMap
              segments={routes.segments}
              places={places.places}
              daySegments={places.daySegments}
              selectedDay={selectedDay}
              selectedPlaceId={currentDay.placeId}
            />
          </div>
        </div>

        <div className="min-h-[400px] lg:col-span-2 xl:col-span-1 xl:min-h-[calc(100vh-120px)]">
          <DayDetail
            day={currentDay}
            placeCoords={placeCoords}
            onPrev={() => dayIndex > 0 && setSelectedDay(itinerary.days[dayIndex - 1].day)}
            onNext={() => dayIndex < itinerary.days.length - 1 && setSelectedDay(itinerary.days[dayIndex + 1].day)}
            hasPrev={dayIndex > 0}
            hasNext={dayIndex < itinerary.days.length - 1}
          />
        </div>
      </div>
      <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
        {itinerary.meta.title} · {itinerary.meta.highlights.join(" · ")}
      </footer>
    </div>
  );
}
