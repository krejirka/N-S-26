import { useCallback, useMemo, useState } from "react";
import Header from "@/components/Header";
import DayList from "@/components/DayList";
import DayDetail from "@/components/DayDetail";
import TripMap from "@/components/TripMap";
import { useRadarAnimation } from "@/hooks/useRadarAnimation";
import itineraryData from "@/data/itinerary.json";
import routesData from "@/data/routes.json";
import placesData from "@/data/places.json";
import type { Itinerary, PlacesData, RoutesData } from "@/types/trip";

const itinerary = itineraryData as Itinerary;
const routes = routesData as RoutesData;
const places = placesData as PlacesData;

export default function Index() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [zoomToDay, setZoomToDay] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const radar = useRadarAnimation(showRadar);

  const selectDay = useCallback((day: number) => {
    setSelectedDay(day);
    setZoomToDay(true);
  }, []);

  const currentDay = useMemo(
    () => itinerary.days.find((d) => d.day === selectedDay) ?? itinerary.days[0],
    [selectedDay]
  );

  const dayIndex = itinerary.days.findIndex((d) => d.day === selectedDay);
  const placeCoords = places.places[currentDay.placeId] ?? null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card shadow-sm">
        <Header
          itinerary={itinerary}
          routes={routes}
          day={currentDay}
          hasPrevDay={dayIndex > 0}
          hasNextDay={dayIndex < itinerary.days.length - 1}
          onPrevDay={() => dayIndex > 0 && selectDay(itinerary.days[dayIndex - 1].day)}
          onNextDay={() =>
            dayIndex < itinerary.days.length - 1 && selectDay(itinerary.days[dayIndex + 1].day)
          }
          frames={radar.frames}
          currentIndex={radar.currentIndex}
          referenceTime={radar.referenceTime}
          isPlaying={radar.isPlaying}
          playMode={radar.playMode}
          radarLoading={radar.loading}
          hasForecast={radar.hasForecast}
          showRadar={showRadar}
          onPlayHistory={radar.playHistory}
          onPlayForecast={radar.playForecast}
          onToggleRadar={() => setShowRadar((v) => !v)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto grid h-full w-full max-w-[1920px] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_380px]">
          <div className="hidden h-full min-h-0 overflow-hidden lg:block">
            <DayList days={itinerary.days} selectedDay={selectedDay} onSelect={selectDay} />
          </div>

          <div className="h-full min-h-0 border-b border-border lg:border-b-0 lg:border-r">
            <TripMap
              segments={routes.segments}
              places={places.places}
              daySegments={places.daySegments}
              day={currentDay}
              selectedPlaceId={currentDay.placeId}
              showRadar={showRadar}
              currentFrame={radar.currentFrame}
              zoomToDay={zoomToDay}
            />
          </div>

          <div className="hidden h-full min-h-0 overflow-hidden lg:block">
            <DayDetail day={currentDay} placeCoords={placeCoords} />
          </div>
        </div>
      </div>
    </div>
  );
}
