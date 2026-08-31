import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchRadarFrames,
  getRadarReferenceTime,
  getRadarSliceIndices,
  type RadarFrame,
} from "@/lib/rainviewer";

const FRAME_MS = 450;

export type RadarPlayMode = "history" | "forecast" | null;

export interface UseRadarAnimationOptions {
  /** Default true on web. Native APK skips autoplay so tiles are not swapped every 450 ms. */
  autoPlay?: boolean;
  /** Pause timers while the map tab or app is hidden. */
  paused?: boolean;
}

export function useRadarAnimation(enabled: boolean, options?: UseRadarAnimationOptions) {
  const autoPlay = options?.autoPlay ?? true;
  const paused = options?.paused ?? false;
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<RadarPlayMode>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayDoneRef = useRef(false);

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
    if (!enabled) {
      autoPlayDoneRef.current = false;
      clearTimer();
      setIsPlaying(false);
      setPlayMode(null);
      setLoading(false);
      return;
    }

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
  }, [enabled, clearTimer]);

  useEffect(() => {
    if (paused) {
      clearTimer();
      setIsPlaying(false);
      setPlayMode(null);
    }
  }, [paused, clearTimer]);

  useEffect(() => {
    if (!enabled || paused || loading || !frames.length || autoPlayDoneRef.current) return;
    if (!autoPlay) {
      autoPlayDoneRef.current = true;
      return;
    }
    const { historyStart, historyEnd } = getRadarSliceIndices(frames);
    playRange(historyStart, historyEnd, "history");
    autoPlayDoneRef.current = true;
  }, [enabled, paused, autoPlay, frames, loading, playRange]);

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
