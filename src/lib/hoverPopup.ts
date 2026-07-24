/** Leaflet hover popups: stay open while pointer is on marker or popup; close otherwise. */
import type { LeafletEventHandlerFnMap } from "leaflet";

const CLOSE_MS = 160;

export function hoverPopupHandlers(): LeafletEventHandlerFnMap {
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearClose = () => {
    if (closeTimer != null) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  return {
    mouseover: (e) => {
      clearClose();
      e.target.openPopup();
    },
    mouseout: (e) => {
      clearClose();
      const marker = e.target;
      closeTimer = setTimeout(() => marker.closePopup(), CLOSE_MS);
    },
    popupopen: (e) => {
      const marker = e.target;
      const el = marker.getPopup()?.getElement();
      if (!el) return;

      const onEnter = () => clearClose();
      const onLeave = () => {
        clearClose();
        closeTimer = setTimeout(() => marker.closePopup(), CLOSE_MS);
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);

      marker.once("popupclose", () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        clearClose();
      });
    },
  };
}
