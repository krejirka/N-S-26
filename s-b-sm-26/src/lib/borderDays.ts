import type {
  BorderCrossingAlt,
  BorderCrossingsData,
  SkippedBorderCrossing,
} from "@/types/trip";

export const BORDER_PAIR_LABELS: Record<string, string> = {
  "HU-RS": "Maďarsko – Srbsko",
  "RS-BG": "Srbsko – Bulharsko",
  "BG-MK": "Bulharsko – Severní Makedonie",
  "MK-RS": "Severní Makedonie – Srbsko",
  "NO-SE": "Norsko – Švédsko",
};

/** Which border pairs the itinerary day actually crosses. */
export const DAY_BORDER_PAIRS: Record<number, string[]> = {
  1: ["HU-RS"],
  3: ["RS-BG"],
  5: ["BG-MK"],
  6: ["MK-RS", "HU-RS"],
};

export function flattenBorderCrossings(data: BorderCrossingsData): BorderCrossingAlt[] {
  const planned: BorderCrossingAlt[] = (data.planned ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    pair: p.pair,
    kind: "planned",
    airKm: 0,
    detourMin: 0,
    openingHoursLabel: p.openingHoursLabel ?? "ověřte na místě",
    note: p.note ?? null,
  }));
  const alts = (data.alternatives ?? []).map((a) => ({
    ...a,
    kind: a.kind ?? "alternative",
  }));
  return [...planned, ...alts];
}

export function crossingsForDay(all: BorderCrossingAlt[], day: number): BorderCrossingAlt[] {
  const pairs = DAY_BORDER_PAIRS[day];
  if (!pairs?.length) return [];
  return all
    .filter((c) => c.pair && pairs.includes(c.pair))
    .sort((a, b) => {
      const pa = pairs.indexOf(a.pair!);
      const pb = pairs.indexOf(b.pair!);
      if (pa !== pb) return pa - pb;
      if ((a.kind === "planned") !== (b.kind === "planned")) return a.kind === "planned" ? -1 : 1;
      return (a.detourMin ?? 0) - (b.detourMin ?? 0);
    });
}

export function skippedForDay(skipped: SkippedBorderCrossing[] | undefined, day: number): SkippedBorderCrossing[] {
  const pairs = DAY_BORDER_PAIRS[day];
  if (!pairs?.length || !skipped?.length) return [];
  return skipped
    .filter((s) => pairs.includes(s.pair))
    .sort((a, b) => a.detourMin - b.detourMin);
}

export function pointsForDay(all: BorderCrossingAlt[], day: number): [number, number][] {
  return crossingsForDay(all, day).map((c) => [c.lat, c.lng]);
}
