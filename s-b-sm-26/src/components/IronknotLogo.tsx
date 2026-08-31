import { useEffect, useState } from "react";
import { usePrefersDark } from "@/hooks/usePrefersDark";
import { LOGO_CYCLE_MS, LOGO_HEADER_PX, LOGO_SPLASH_PX } from "@/lib/brand";

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
  const variant = dark ? "dark" : "light";
  const isSplash = size === "splash";
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (isSplash) {
      setPlaying(true);
      return;
    }
    setPlaying(true);
    const hold = window.setTimeout(() => setPlaying(false), LOGO_CYCLE_MS);
    return () => window.clearTimeout(hold);
  }, [playKey, variant, isSplash]);

  const base = import.meta.env.BASE_URL;
  const src = playing
    ? `${base}ironknot-logo-${variant}.gif?p=${playKey}`
    : `${base}ironknot-logo-${variant}-still.png`;
  const px = isSplash ? LOGO_SPLASH_PX : LOGO_HEADER_PX;

  return (
    <img
      src={src}
      alt="Ironknot"
      width={px}
      height={px}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
