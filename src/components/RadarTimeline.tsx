import { Pause, Play } from "lucide-react";
import { formatRadarOffsetMinutes, type RadarFrame } from "@/lib/rainviewer";
import type { RadarPlayMode } from "@/hooks/useRadarAnimation";

interface RadarTimelineProps {
  frames: RadarFrame[];
  currentIndex: number;
  referenceTime: number;
  isPlaying: boolean;
  playMode: RadarPlayMode;
  loading: boolean;
  hasForecast: boolean;
  showRadar: boolean;
  onPlayHistory: () => void;
  onPlayForecast: () => void;
  onToggleRadar: () => void;
}

export default function RadarTimeline({
  frames,
  currentIndex,
  referenceTime,
  isPlaying,
  playMode,
  loading,
  hasForecast,
  showRadar,
  onPlayHistory,
  onPlayForecast,
  onToggleRadar,
}: RadarTimelineProps) {
  const frame = frames[currentIndex];
  const offset = frame ? formatRadarOffsetMinutes(frame.time, referenceTime) : "—";

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <button
        type="button"
        onClick={onToggleRadar}
        className={`rounded px-2 py-0.5 font-medium transition ${
          showRadar ? "bg-sky-600 text-white hover:bg-sky-700" : "bg-muted text-foreground hover:bg-muted/80"
        }`}
        title="Radar srážek (RainViewer)"
      >
        Radar
      </button>

      {!showRadar ? null : loading ? (
        <span className="text-muted-foreground">Načítám radar…</span>
      ) : !frames.length ? (
        <span className="text-muted-foreground">Radar nedostupný</span>
      ) : (
        <>
          <button
            type="button"
            onClick={onPlayHistory}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted"
            title={isPlaying && playMode === "history" ? "Zastavit historii" : "Přehrát historii −120 → 0 min"}
            aria-label={isPlaying && playMode === "history" ? "Zastavit historii" : "Přehrát historii"}
          >
            {isPlaying && playMode === "history" ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </button>

          <span className="min-w-[4.5rem] tabular-nums font-medium text-foreground">{offset}</span>

          <button
            type="button"
            onClick={onPlayForecast}
            disabled={!hasForecast}
            className="rounded border border-border bg-background px-2 py-0.5 font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            title={
              hasForecast
                ? isPlaying && playMode === "forecast"
                  ? "Zastavit predikci"
                  : "Predikce animace +60 min"
                : "Predikce momentálně nedostupná"
            }
          >
            {isPlaying && playMode === "forecast" ? "Zastavit" : "+60 min"}
          </button>
        </>
      )}
    </div>
  );
}
