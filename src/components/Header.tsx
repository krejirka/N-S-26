import type { Itinerary, RoutesData, TripDay } from "@/types/trip";
import type { RadarPlayMode } from "@/hooks/useRadarAnimation";
import type { RadarFrame } from "@/lib/rainviewer";
import DayNav from "@/components/DayNav";
import RadarTimeline from "@/components/RadarTimeline";

interface HeaderProps {
  itinerary: Itinerary;
  routes: RoutesData;
  day: TripDay;
  hasPrevDay: boolean;
  hasNextDay: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  frames: RadarFrame[];
  currentIndex: number;
  referenceTime: number;
  isPlaying: boolean;
  playMode: RadarPlayMode;
  radarLoading: boolean;
  hasForecast: boolean;
  showRadar: boolean;
  onPlayHistory: () => void;
  onPlayForecast: () => void;
  onToggleRadar: () => void;
}

export default function Header({
  itinerary,
  routes,
  day,
  hasPrevDay,
  hasNextDay,
  onPrevDay,
  onNextDay,
  frames,
  currentIndex,
  referenceTime,
  isPlaying,
  playMode,
  radarLoading,
  hasForecast,
  showRadar,
  onPlayHistory,
  onPlayForecast,
  onToggleRadar,
}: HeaderProps) {
  const { meta } = itinerary;

  return (
    <header className="bg-card px-4 py-3 md:px-8">
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid w-full grid-cols-1 items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:gap-x-8 md:pr-0 lg:gap-x-12">
          <div className="min-w-0 shrink-0">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Cestovní plán
              <span className="ml-2 font-normal normal-case text-muted-foreground">
                · {meta.totalDays} dní / {routes.totalDistanceKm.toLocaleString("cs-CZ")} km
              </span>
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{meta.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{meta.highlights.join(" · ")}</p>
            <div className="mt-2">
              <RadarTimeline
                frames={frames}
                currentIndex={currentIndex}
                referenceTime={referenceTime}
                isPlaying={isPlaying}
                playMode={playMode}
                loading={radarLoading}
                hasForecast={hasForecast}
                showRadar={showRadar}
                onPlayHistory={onPlayHistory}
                onPlayForecast={onPlayForecast}
                onToggleRadar={onToggleRadar}
              />
            </div>
          </div>

          <DayNav
            day={day}
            hasPrev={hasPrevDay}
            hasNext={hasNextDay}
            onPrev={onPrevDay}
            onNext={onNextDay}
          />
        </div>
      </div>
    </header>
  );
}
