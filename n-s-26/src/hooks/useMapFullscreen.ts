import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

function isMapFsState(state: unknown): boolean {
  return Boolean(state && typeof state === "object" && (state as { mapFs?: unknown }).mapFs);
}

/**
 * Fullscreen map: Fullscreen API in the browser, CSS overlay as fallback.
 * Browser back exits via a dummy history entry.
 */
export function useMapFullscreen(wrapRef: RefObject<HTMLElement | null>) {
  const [fullscreen, setFullscreen] = useState(false);
  const pushedRef = useRef(false);

  const exit = useCallback(() => setFullscreen(false), []);
  const toggle = useCallback(() => setFullscreen((v) => !v), []);

  useEffect(() => {
    const el = wrapRef.current;
    if (fullscreen) {
      if (!pushedRef.current) {
        history.pushState({ mapFs: 1 }, "");
        pushedRef.current = true;
      }
      void el?.requestFullscreen?.().catch(() => {});
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    if (pushedRef.current) {
      pushedRef.current = false;
      if (isMapFsState(history.state)) history.back();
    }
  }, [fullscreen, wrapRef]);

  useEffect(() => {
    const onPop = () => {
      pushedRef.current = false;
      setFullscreen(false);
    };
    const onFs = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return { fullscreen, toggle, exit };
}
