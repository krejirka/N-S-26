import { IS_NATIVE } from "@/lib/runtime";

interface OfflineHintProps {
  show: boolean;
  children: string;
  className?: string;
}

/** Android-only warning when a live feature needs a data connection. */
export default function OfflineHint({ show, children, className = "" }: OfflineHintProps) {
  if (!IS_NATIVE || !show) return null;
  return (
    <span
      className={`inline-flex items-center rounded-md border border-amber-400/80 bg-amber-50 px-2 py-0.5 text-[11px] font-medium leading-snug text-amber-950 ${className}`}
    >
      {children}
    </span>
  );
}
