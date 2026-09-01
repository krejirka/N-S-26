import NavigateButton from "./NavigateButton";
import {
  BORDER_PAIR_LABELS,
  crossingsForDay,
  skippedForDay,
} from "@/lib/borderDays";
import type { BorderCrossingAlt, SkippedBorderCrossing } from "@/types/trip";

interface DayBorderCrossingsProps {
  day: number;
  crossings: BorderCrossingAlt[];
  skipped?: SkippedBorderCrossing[];
}

export default function DayBorderCrossings({
  day,
  crossings,
  skipped = [],
}: DayBorderCrossingsProps) {
  const items = crossingsForDay(crossings, day);
  const overLimit = skippedForDay(skipped, day);
  if (!items.length && !overLimit.length) return null;

  const pairs = [...new Set(items.map((c) => c.pair).filter(Boolean))] as string[];

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Hraniční přechody
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Plánovaný přechod na trase a oficiální alternativy do 90 min zajížďky (OSRM). Na mapě vrstva
        Přechody (malé ikony ZOLL, defaultně vypnutá). Otevírací dobu ověřte na místě.
      </p>

      {pairs.map((pair) => {
        const group = items.filter((c) => c.pair === pair);
        const pairSkipped = overLimit.filter((s) => s.pair === pair);
        return (
          <div key={pair} className="mt-3">
            <h4 className="text-sm font-semibold text-foreground">
              {BORDER_PAIR_LABELS[pair] ?? pair}
            </h4>
            <ul className="mt-2 space-y-3">
              {group.map((c) => {
                const planned = c.kind === "planned";
                return (
                  <li key={c.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {planned
                            ? "Plánovaný přechod na trase"
                            : `Alternativa · zajížďka ~${c.detourMin} min · ${c.airKm} km vzdušnou čarou`}
                        </p>
                      </div>
                      <NavigateButton lat={c.lat} lng={c.lng} label={c.name} variant="link">
                        Navigovat
                      </NavigateButton>
                    </div>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      Provoz: {c.openingHoursLabel}
                    </p>
                    {c.note ? <p className="mt-0.5 text-xs text-muted-foreground">{c.note}</p> : null}
                  </li>
                );
              })}
            </ul>
            {pairSkipped.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Další oficiální přechody mimo 90 min:{" "}
                {pairSkipped.map((s) => `${s.name} (~${s.detourMin} min)`).join("; ")}.
              </p>
            ) : !group.some((c) => c.kind === "alternative") ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Žádný další oficiální silniční přechod na tomto úseku není do 90 min zajížďky.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
