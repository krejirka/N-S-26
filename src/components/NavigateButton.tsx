import { useEffect, useId, useState, type ReactNode } from "react";
import { ExternalLink, MapPinned, X } from "lucide-react";
import { formatCoords, navigationOptions } from "@/lib/navLink";

interface NavigateButtonProps {
  lat: number;
  lng: number;
  label: string;
  /** Button text */
  children?: ReactNode;
  className?: string;
  /** Compact link style for map popups */
  variant?: "button" | "link";
}

export default function NavigateButton({
  lat,
  lng,
  label,
  children = "Navigovat",
  className,
  variant = "button",
}: NavigateButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const options = navigationOptions(lat, lng, label);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const triggerClass =
    className ??
    (variant === "link"
      ? "mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
      : "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {children}
        <ExternalLink className={variant === "link" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 shrink-0 text-primary" />
                  <h2 id={titleId} className="text-base font-semibold">
                    Navigovat
                  </h2>
                </div>
                <p className="mt-1 truncate text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{formatCoords(lat, lng)}</p>
              </div>
              <button
                type="button"
                aria-label="Zavřít"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="flex flex-col gap-2">
              {options.map((opt) => (
                <li key={opt.id}>
                  <a
                    href={opt.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-medium transition hover:border-primary hover:bg-muted/60"
                  >
                    <span>
                      {opt.label}
                      {opt.hint && (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {opt.hint}
                        </span>
                      )}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
