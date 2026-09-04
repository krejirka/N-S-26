import type { EvCharger, EvLiveStatus } from "@/types/trip";

export function stallsLabel(charger: EvCharger, live?: EvLiveStatus | null): string | null {
  if (live?.live && live.available != null && live.total != null && live.total > 0) {
    return `Volné ${live.available} / ${live.total}`;
  }
  if (live?.live && live.available != null) {
    return `Volné ${live.available}`;
  }
  if (charger.stallsTotal != null && charger.stallsTotal > 0) {
    return `${charger.stallsTotal} stojanů`;
  }
  return null;
}

export function feeBadge(charger: EvCharger): { text: string; free: boolean } | null {
  if (charger.fee === "no") return { text: "zdarma", free: true };
  if (charger.fee === "yes") return { text: charger.feeLabel || "placené", free: false };
  if (charger.feeLabel) return { text: charger.feeLabel, free: false };
  return null;
}
