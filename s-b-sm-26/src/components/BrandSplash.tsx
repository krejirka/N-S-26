import { useEffect, useState } from "react";
import IronknotLogo from "@/components/IronknotLogo";
import { usePrefersDark } from "@/hooks/usePrefersDark";
import { LOGO_CYCLE_MS, LOGO_FADE_MS } from "@/lib/brand";

export default function BrandSplash() {
  const dark = usePrefersDark();
  const [phase, setPhase] = useState<"show" | "fade" | "done">("show");

  useEffect(() => {
    const fadeAt = window.setTimeout(() => setPhase("fade"), LOGO_CYCLE_MS);
    const doneAt = window.setTimeout(() => setPhase("done"), LOGO_CYCLE_MS + LOGO_FADE_MS);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[4000] flex items-center justify-center transition-opacity ease-out ${
        phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        background: dark ? "#0f1115" : "#ececec",
        transitionDuration: `${LOGO_FADE_MS}ms`,
      }}
      aria-hidden
    >
      <IronknotLogo size="splash" surface={dark ? "dark" : "light"} playKey={0} />
    </div>
  );
}
