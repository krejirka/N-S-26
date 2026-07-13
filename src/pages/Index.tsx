import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type MobileView = "list" | "map" | "detail";

const MOBILE_TABS: { id: MobileView; label: string }[] = [
  { id: "list", label: "Itinerář" },
  { id: "map", label: "Mapa" },
  { id: "detail", label: "Detail dne" },
];

export default function Index() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [zoomToDay, setZoomToDay] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("map");
  const pendingRadarPlayRef = useRef(false);
  const radar = useRadarAnimation(showRadar);

  const selectDay = useCallback((day: number) => {
    setSelectedDay(day);
    setZoomToDay(true);
    setShowRadar(false);
  }, []);

  const selectDayFromList = useCallback(
    (day: number) => {
      selectDay(day);
      setMobileView("map");
    },
    [selectDay]
  );

  const handleToggleRadar = useCallback(() => {
    if (showRadar) {
      setShowRadar(false);
      return;
    }
    setZoomToDay(false);
    setShowRadar(true);
    pendingRadarPlayRef.current = true;
  }, [showRadar]);

  useEffect(() => {
    if (!showRadar || zoomToDay || radar.loading || !radar.frames.length || !pendingRadarPlayRef.current) {
      return;
    }
    pendingRadarPlayRef.current = false;
    radar.playHistory();
  }, [showRadar, zoomToDay, radar.loading, radar.frames.length, radar.playHistory]);

  const currentDay = useMemo(
    () => itinerary.days.find((d) => d.day === selectedDay) ?? itinerary.days[0],
    [selectedDay]
  );

  const dayIndex = itinerary.days.findIndex((d) => d.day === selectedDay);
  const placeCoords = places.places[currentDay.placeId] ?? null;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
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
        />
      </div>

      <div className="shrink-0 border-b border-border bg-card lg:hidden">
        <div className="flex">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileView(tab.id)}
              className={`flex-1 border-b-2 px-2 py-2 text-sm font-medium transition ${
                mobileView === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1920px] flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_380px]">
          <div
            className={`${
              mobileView === "list" ? "block" : "hidden"
            } h-full min-h-0 overflow-hidden lg:block`}
          >
            <DayList days={itinerary.days} selectedDay={selectedDay} onSelect={selectDayFromList} />
          </div>

          <div
            className={`${
              mobileView === "map" ? "block" : "hidden"
            } h-full min-h-0 overflow-hidden lg:block lg:border-r lg:border-border`}
          >
            <TripMap
              segments={routes.segments}
              places={places.places}
              daySegments={places.daySegments}
              day={currentDay}
              selectedPlaceId={currentDay.placeId}
              showRadar={showRadar}
              currentFrame={radar.currentFrame}
              zoomToDay={zoomToDay}
              frames={radar.frames}
              currentIndex={radar.currentIndex}
              referenceTime={radar.referenceTime}
              isPlaying={radar.isPlaying}
              playMode={radar.playMode}
              radarLoading={radar.loading}
              hasForecast={radar.hasForecast}
              onPlayHistory={radar.playHistory}
              onPlayForecast={radar.playForecast}
              onToggleRadar={handleToggleRadar}
            />
          </div>

          <div
            className={`${
              mobileView === "detail" ? "block" : "hidden"
            } h-full min-h-0 overflow-hidden lg:block`}
          >
            <DayDetail day={currentDay} placeCoords={placeCoords} />
          </div>
        </div>
      </div>
    </div>
  );
}
