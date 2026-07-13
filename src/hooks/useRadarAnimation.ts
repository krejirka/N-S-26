import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchRadarFrames,
  getRadarReferenceTime,
  getRadarSliceIndices,
  type RadarFrame,
} from "@/lib/rainviewer";

const FRAME_MS = 500;

export type RadarPlayMode = "history" | "forecast" | null;

export function useRadarAnimation(enabled: boolean) {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<RadarPlayMode>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    setPlayMode(null);
  }, [clearTimer]);

  const playRange = useCallback(
    (fromIndex: number, toIndex: number, mode: RadarPlayMode) => {
      if (!frames.length || fromIndex > toIndex) return;
      clearTimer();
      setIsPlaying(true);
      setPlayMode(mode);
      let i = fromIndex;
      setCurrentIndex(i);

      timerRef.current = setInterval(() => {
        if (i >= toIndex) {
          clearTimer();
          setIsPlaying(false);
          setPlayMode(null);
          return;
        }
        i += 1;
        setCurrentIndex(i);
      }, FRAME_MS);
    },
    [clearTimer, frames]
  );

  const playHistory = useCallback(() => {
    const { historyStart, historyEnd } = getRadarSliceIndices(frames);
    if (isPlaying && playMode === "history") {
      stop();
      return;
    }
    stop();
    playRange(historyStart, historyEnd, "history");
  }, [frames, isPlaying, playMode, playRange, stop]);

  const playForecast = useCallback(() => {
    const { forecastStart, forecastEnd, hasForecast } = getRadarSliceIndices(frames);
    if (!hasForecast) return;
    if (isPlaying && playMode === "forecast") {
      stop();
      return;
    }
    stop();
    playRange(forecastStart, forecastEnd, "forecast");
  }, [frames, isPlaying, playMode, playRange, stop]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);

    fetchRadarFrames()
      .then((data) => {
        if (cancelled) return;
        const { historyEnd } = getRadarSliceIndices(data);
        setFrames(data);
        setCurrentIndex(historyEnd >= 0 ? historyEnd : 0);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFrames([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const slice = getRadarSliceIndices(frames);
  const referenceTime = frames.length ? getRadarReferenceTime(frames) : 0;
  const currentFrame = frames[currentIndex] ?? null;

  return {
    frames,
    currentIndex,
    currentFrame,
    referenceTime,
    isPlaying,
    playMode,
    loading,
    hasForecast: slice.hasForecast,
    setCurrentIndex: (index: number) => {
      stop();
      setCurrentIndex(index);
    },
    playHistory,
    playForecast,
    stop,
  };
}
