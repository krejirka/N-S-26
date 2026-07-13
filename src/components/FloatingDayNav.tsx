import { ChevronLeft, ChevronRight } from "lucide-react";

interface FloatingDayNavProps {
  day: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function FloatingDayNav({ day, hasPrev, hasNext, onPrev, onNext }: FloatingDayNavProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[1000] flex items-center justify-center gap-2 px-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Předchozí den"
        className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border bg-card/95 px-3 py-2 text-sm font-medium shadow-md backdrop-blur-sm transition hover:bg-card disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Předchozí</span>
      </button>
      <span className="pointer-events-none rounded-full border border-border bg-card/95 px-3 py-2 text-sm font-semibold shadow-md backdrop-blur-sm">
        Den {day}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Další den"
        className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border bg-card/95 px-3 py-2 text-sm font-medium shadow-md backdrop-blur-sm transition hover:bg-card disabled:opacity-40"
      >
        <span className="hidden sm:inline">Další</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
