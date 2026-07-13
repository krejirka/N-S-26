import PlaceCard from "./PlaceCard";
import YrForecast from "./YrForecast";
import RadarTimeline from "./RadarTimeline";
import type { RadarPlayMode } from "@/hooks/useRadarAnimation";
import type { RadarFrame } from "@/lib/rainviewer";
import type { Place, TripDay } from "@/types/trip";

interface DayDetailProps {
  day: TripDay;
  placeCoords: Place | null;
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

export default function DayDetail({
  day,
  placeCoords,
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
}: DayDetailProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4 rounded-xl border border-border bg-card p-3">
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
