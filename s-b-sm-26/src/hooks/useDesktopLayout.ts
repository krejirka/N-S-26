import { useEffect, useState } from "react";

const QUERY = "(min-width: 1024px)";

/** Same breakpoint as Tailwind `lg` — map pane is always on screen. */
export function useDesktopLayout(): boolean {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return desktop;
}
