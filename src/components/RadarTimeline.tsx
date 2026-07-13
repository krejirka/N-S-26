import { Pause, Play } from "lucide-react";
import { formatRadarClock, formatRadarOffsetMinutes, type RadarFrame } from "@/lib/rainviewer";

interface RadarTimelineProps {
  frames: RadarFrame[];
  currentIndex: number;
  referenceTime: number;
  isPlaying: boolean;
  loading: boolean;
  onIndexChange: (index: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

const timelinePosition =
  "absolute left-2 right-2 top-[7.5rem] z-[999] sm:top-[8.5rem]";

export default function RadarTimeline({
  frames,
  currentIndex,
  referenceTime,
  isPlaying,
  loading,
  onIndexChange,
  onPlay,
  onStop,
}: RadarTimelineProps) {
  if (loading) {
    return (
      <div
        className={`${timelinePosition} rounded-lg border border-border bg-card/95 px-3 py-2 text-[11px] text-muted-foreground shadow backdrop-blur-sm`}
      >
        Načítám radar srážek…
      </div>
    );
  }

  if (!frames.length) return null;

  const frame = frames[currentIndex];
  const offset = formatRadarOffsetMinutes(frame.time, referenceTime);
  const clock = formatRadarClock(frame.time);
  const isForecast = frame.kind === "nowcast";

  return (
    <div
      className={`${timelinePosition} rounded-lg border border-border bg-card/95 px-3 py-2 shadow backdrop-blur-sm`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-foreground">
          Srážky {isForecast ? "· predikce" : "· historie"}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {offset} · {clock}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isPlaying ? onStop : onPlay}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted"
          title={isPlaying ? "Pozastavit" : "Přehrát animaci"}
          aria-label={isPlaying ? "Pozastavit animaci" : "Přehrát animaci"}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={currentIndex}
          onChange={(e) => onIndexChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer accent-sky-600"
          aria-label="Čas radarové animace"
        />
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{formatRadarOffsetMinutes(frames[0].time, referenceTime)}</span>
        <span>teď</span>
        <span>{formatRadarOffsetMinutes(frames[frames.length - 1].time, referenceTime)}</span>
      </div>
    </div>
  );
}
