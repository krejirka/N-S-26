import { useEffect, useState } from "react";
import { usePrefersDark } from "@/hooks/usePrefersDark";
import { HEADER_BAR_BG, LOGO_CYCLE_MS, LOGO_HEADER_PX, LOGO_SPLASH_PX } from "@/lib/brand";

interface IronknotLogoProps {
  size?: "header" | "splash";
  surface?: "light" | "dark" | "auto";
  /** Bump to replay a single rotation (header). */
  playKey?: number;
  className?: string;
}

export default function IronknotLogo({
  size = "header",
  surface = "auto",
  playKey = 0,
  className = "",
}: IronknotLogoProps) {
  const prefersDark = usePrefersDark();
  const dark = surface === "auto" ? prefersDark : surface === "dark";
  const isSplash = size === "splash";
  const [playing, setPlaying] = useState(!isSplash);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    if (isSplash) return;
    setPlaying(true);
    const hold = window.setTimeout(() => setPlaying(false), LOGO_CYCLE_MS);
    return () => window.clearTimeout(hold);
  }, [playKey, isSplash]);

  if (isSplash) {
    const gif = `${base}ironknot-logo-${dark ? "dark" : "light"}.gif`;
    return (
      <img
        src={gif}
        alt="Ironknot"
        width={LOGO_SPLASH_PX}
        height={LOGO_SPLASH_PX}
        className={`shrink-0 object-contain ${className}`}
        style={{ width: LOGO_SPLASH_PX, height: LOGO_SPLASH_PX }}
      />
    );
  }

  const px = LOGO_HEADER_PX;

  return (
    <span
      className={`relative block shrink-0 overflow-hidden ${className}`}
      style={{ width: px, height: px, background: HEADER_BAR_BG }}
    >
      <img
        src={`${base}ironknot-mark.png`}
        alt="Ironknot"
        width={px}
        height={px}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {playing && (
        <img
          key={playKey}
          src={`${base}ironknot-logo-dark.gif`}
          alt=""
          width={px}
          height={px}
          className="absolute inset-0 h-full w-full object-contain"
          onError={() => setPlaying(false)}
        />
      )}
    </span>
  );
}
