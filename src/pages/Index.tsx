import { useMemo, useState } from "react";
import Header from "@/components/Header";
import DayList from "@/components/DayList";
import DayDetail from "@/components/DayDetail";
import TripMap from "@/components/TripMap";
import FloatingDayNav from "@/components/FloatingDayNav";
import RadarTimeline from "@/components/RadarTimeline";
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
  const [showRadar, setShowRadar] = useState(true);
  const radar = useRadarAnimation(showRadar);

  const currentDay = useMemo(
    () => itinerary.days.find((d) => d.day === selectedDay) ?? itinerary.days[0],
    [selectedDay]
  );

  const dayIndex = itinerary.days.findIndex((d) => d.day === selectedDay);
  const placeCoords = places.places[currentDay.placeId] ?? null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card shadow-sm">
        <Header itinerary={itinerary} routes={routes} />
        <FloatingDayNav
          day={currentDay}
          hasPrev={dayIndex > 0}
          hasNext={dayIndex < itinerary.days.length - 1}
          onPrev={() => dayIndex > 0 && setSelectedDay(itinerary.days[dayIndex - 1].day)}
          onNext={() =>
            dayIndex < itinerary.days.length - 1 && setSelectedDay(itinerary.days[dayIndex + 1].day)
          }
        />
        <RadarTimeline
          frames={radar.frames}
          currentIndex={radar.currentIndex}
          referenceTime={radar.referenceTime}
          isPlaying={radar.isPlaying}
          playMode={radar.playMode}
          loading={radar.loading}
          hasForecast={radar.hasForecast}
          showRadar={showRadar}
          onPlayHistory={radar.playHistory}
          onPlayForecast={radar.playForecast}
          onToggleRadar={() => setShowRadar((v) => !v)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_1.35fr_360px]">
          <div>
            <DayList days={itinerary.days} selectedDay={selectedDay} onSelect={setSelectedDay} />
          </div>

          <div className="flex min-h-[360px] flex-col border-b border-border lg:min-h-[480px] lg:border-b-0 lg:border-r">
            <div className="relative min-h-[360px] flex-1 lg:min-h-[480px]">
              <TripMap
                segments={routes.segments}
                places={places.places}
                daySegments={places.daySegments}
                day={currentDay}
                selectedPlaceId={currentDay.placeId}
                showRadar={showRadar}
                currentFrame={radar.currentFrame}
              />
            </div>
          </div>

          <div className="min-h-[400px]">
            <DayDetail day={currentDay} placeCoords={placeCoords} />
          </div>
        </div>

        <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
          {itinerary.meta.title} · {itinerary.meta.highlights.join(" · ")}
        </footer>
      </div>
    </div>
  );
}
