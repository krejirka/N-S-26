import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchRadarFrames,
  getRadarReferenceTime,
  type RadarFrame,
} from "@/lib/rainviewer";

const FRAME_MS = 450;

export function useRadarAnimation(enabled: boolean) {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayDone, setAutoPlayDone] = useState(false);
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
  }, [clearTimer]);

  const playSequence = useCallback(
    (fromIndex = 0) => {
      if (!frames.length) return;
      clearTimer();
      setIsPlaying(true);
      let i = fromIndex;
      setCurrentIndex(i);

      timerRef.current = setInterval(() => {
        i += 1;
        if (i >= frames.length) {
          clearTimer();
          setIsPlaying(false);
          setCurrentIndex(frames.length - 1);
          return;
        }
        setCurrentIndex(i);
      }, FRAME_MS);
    },
    [clearTimer, frames]
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);

    fetchRadarFrames()
      .then((data) => {
        if (cancelled) return;
        setFrames(data);
        setCurrentIndex(0);
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

  useEffect(() => {
    if (!enabled || !frames.length || autoPlayDone) return;
    playSequence(0);
    setAutoPlayDone(true);
  }, [enabled, frames, autoPlayDone, playSequence]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const referenceTime = frames.length ? getRadarReferenceTime(frames) : 0;
  const currentFrame = frames[currentIndex] ?? null;

  return {
    frames,
    currentIndex,
    currentFrame,
    referenceTime,
    isPlaying,
    loading,
    autoPlayDone,
    setCurrentIndex: (index: number) => {
      stop();
      setCurrentIndex(index);
    },
    playManual: () => playSequence(0),
    stop,
  };
}
