import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import DayList from "@/components/DayList";
import DayDetail from "@/components/DayDetail";
import TripMap from "@/components/TripMap";
import { useRadarAnimation } from "@/hooks/useRadarAnimation";
import { useDayIncidents } from "@/hooks/useDayIncidents";
import { hikeForDay } from "@/lib/hikes";
import itineraryData from "@/data/itinerary.json";
import routesData from "@/data/routes.json";
import placesData from "@/data/places.json";
import shopsData from "@/data/shops.json";
import lodgingsData from "@/data/lodgings.json";
import corridorPoisData from "@/data/corridor-pois.json";
import fishingSpotsData from "@/data/fishing-spots.json";
import borderCrossingsData from "@/data/border-crossings.json";
import evChargersData from "@/data/ev-chargers.json";
import type {
  BorderCrossingsData,
  CorridorPoisData,
  EvChargersData,
  FishingSpotsData,
  Itinerary,
  LodgingsData,
  PlacesData,
  RoutesData,
  ShopsData,
} from "@/types/trip";

const itinerary = itineraryData as Itinerary;
const routes = routesData as RoutesData;
const places = placesData as PlacesData;
const shops = (shopsData as ShopsData).shops;
const lodgings = (lodgingsData as LodgingsData).lodgings;
const corridorPois = (corridorPoisData as CorridorPoisData).pois ?? [];
const fishingSpots = (fishingSpotsData as FishingSpotsData).spots ?? [];
const borderCrossings = (borderCrossingsData as BorderCrossingsData).alternatives ?? [];
const evChargers = (evChargersData as EvChargersData).chargers ?? [];

type MobileView = "list" | "map" | "detail";

const MOBILE_TABS: { id: MobileView; label: string }[] = [
  { id: "list", label: "Itinerář" },
  { id: "map", label: "Mapa" },
  { id: "detail", label: "Detail dne" },
];

/** Today's date as YYYY-MM-DD in Europe/Prague. */
function pragueToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** before / after trip → full route; during trip on a matching date → day detail. */
function initialZoomToDay(days: Itinerary["days"]): boolean {
  if (!days.length) return false;
  const today = pragueToday();
  if (today < days[0].date || today > days[days.length - 1].date) return false;
  return days.some((d) => d.date === today);
}

/** Pick itinerary day for "today" in Europe/Prague. */
function dayForToday(days: Itinerary["days"]): number {
  const today = pragueToday();

  if (!days.length) return 1;
  if (today < days[0].date) return days[0].day;
  if (today > days[days.length - 1].date) return days[days.length - 1].day;
  const match = days.find((d) => d.date === today);
  return match?.day ?? days[0].day;
}

interface IndexProps {
  showDates: boolean;
}

export default function Index({ showDates }: IndexProps) {
  const initialDay = useMemo(() => dayForToday(itinerary.days), []);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  /** false = full-route overview (lock); true = fit selected day. */
  const [zoomToDay, setZoomToDay] = useState(() => initialZoomToDay(itinerary.days));
  const [showRadar, setShowRadar] = useState(true);
  const [fitNonce, setFitNonce] = useState(0);
  const [mobileView, setMobileView] = useState<MobileView>("map");
  const radar = useRadarAnimation(showRadar);

  const selectDay = useCallback((day: number) => {
    setSelectedDay(day);
    setZoomToDay(true);
    if (hikeForDay(day)) setShowRadar(false);
  }, []);

  const selectDayFromList = useCallback(
    (day: number) => {
      selectDay(day);
      setMobileView("map");
    },
    [selectDay]
  );

  const handleToggleFullRoute = useCallback(() => {
    setZoomToDay((dayZoom) => !dayZoom);
  }, []);

  const handleToggleRadar = useCallback(() => {
    if (showRadar) {
      setShowRadar(false);
      return;
    }
    setFitNonce((n) => n + 1);
    setShowRadar(true);
  }, [showRadar]);

  const handleRadarAutoDisable = useCallback(() => {
    setShowRadar(false);
  }, []);

  const currentDay = useMemo(
    () => itinerary.days.find((d) => d.day === selectedDay) ?? itinerary.days[0],
    [selectedDay]
  );

  useEffect(() => {
    if (zoomToDay && hikeForDay(selectedDay)) setShowRadar(false);
  }, [selectedDay, zoomToDay]);

  const dayIncidents = useDayIncidents(currentDay, routes.segments, places.daySegments);

  const dayIndex = itinerary.days.findIndex((d) => d.day === selectedDay);
  const placeCoords = places.places[currentDay.placeId] ?? null;
  const fullRouteLocked = !zoomToDay;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card shadow-sm">
        <Header
          itinerary={itinerary}
          routes={routes}
          daySegments={places.daySegments}
          day={currentDay}
          showDates={showDates}
          hasPrevDay={dayIndex > 0}
          hasNextDay={dayIndex < itinerary.days.length - 1}
          onPrevDay={() => dayIndex > 0 && selectDay(itinerary.days[dayIndex - 1].day)}
          onNextDay={() =>
            dayIndex < itinerary.days.length - 1 && selectDay(itinerary.days[dayIndex + 1].day)
          }
          fullRouteLocked={fullRouteLocked}
          onToggleFullRoute={handleToggleFullRoute}
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
            <DayList
              days={itinerary.days}
              selectedDay={selectedDay}
              onSelect={selectDayFromList}
              showDates={showDates}
              segments={routes.segments}
              daySegments={places.daySegments}
            />
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
              shops={shops}
              lodgings={lodgings}
              corridorPois={corridorPois}
              evChargers={evChargers}
              fishingSpots={fishingSpots}
              borderCrossings={borderCrossings}
              trafficIncidents={zoomToDay ? dayIncidents.incidents : []}
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
              onRadarAutoDisable={handleRadarAutoDisable}
              fitNonce={fitNonce}
            />
          </div>

          <div
            className={`${
              mobileView === "detail" ? "block" : "hidden"
            } h-full min-h-0 overflow-hidden lg:block`}
          >
            <DayDetail
              day={currentDay}
              placeCoords={placeCoords}
              places={places.places}
              segments={routes.segments}
              daySegments={places.daySegments}
              incidents={dayIncidents}
              corridorPois={corridorPois}
              evChargers={evChargers}
              fishingSpots={fishingSpots}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
