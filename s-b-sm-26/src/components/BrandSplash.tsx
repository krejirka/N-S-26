import { useEffect, useState } from "react";
import IronknotLogo from "@/components/IronknotLogo";
import { usePrefersDark } from "@/hooks/usePrefersDark";

const SHOW_MS = 2800;
const FADE_MS = 500;

export default function BrandSplash() {
  const dark = usePrefersDark();
  const [phase, setPhase] = useState<"show" | "fade" | "done">("show");

  useEffect(() => {
    const fadeAt = window.setTimeout(() => setPhase("fade"), SHOW_MS);
    const doneAt = window.setTimeout(() => setPhase("done"), SHOW_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[4000] flex items-center justify-center transition-opacity duration-500 ${
        phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ background: dark ? "#0f1115" : "#ececec" }}
      aria-hidden
    >
      <IronknotLogo size="splash" surface={dark ? "dark" : "light"} />
    </div>
  );
}
