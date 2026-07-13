import { useEffect, useRef } from "react";
import type { TripDay } from "@/types/trip";

interface DayListProps {
  days: TripDay[];
  selectedDay: number;
  onSelect: (day: number) => void;
}

function formatDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
  });
}

export default function DayList({ days, selectedDay, onSelect }: DayListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(`[data-day="${selectedDay}"]`);
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedDay]);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-card">
      <div className="shrink-0 border-b border-border px-4 py-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Itinerář</h2>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
        {days.map((d) => {
          const active = d.day === selectedDay;
          return (
            <button
              key={d.day}
              type="button"
              data-day={d.day}
              onClick={() => onSelect(d.day)}
              className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  active ? "bg-primary-foreground/20" : "bg-muted text-foreground"
                }`}
              >
                {d.day}
              </span>
              <span className="min-w-0">
                <span className="block text-xs opacity-80">
                  {formatDate(d.date)} · {d.weekday}
                </span>
                <span className="block truncate font-medium">{d.destination}</span>
                {d.km != null && (
                  <span className={`mt-0.5 block text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {d.km} km
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
