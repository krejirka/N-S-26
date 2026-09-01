import { useEffect, useState } from "react";

/** False when the tab is backgrounded — stop GPS. */
export function useAppVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible"
  );

  useEffect(() => {
    const apply = () => {
      const v = document.visibilityState === "visible";
      setVisible(v);
      document.documentElement.classList.toggle("app-hidden", !v);
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    window.addEventListener("pageshow", apply);
    window.addEventListener("pagehide", apply);
    return () => {
      document.removeEventListener("visibilitychange", apply);
      window.removeEventListener("pageshow", apply);
      window.removeEventListener("pagehide", apply);
    };
  }, []);

  return visible;
}
