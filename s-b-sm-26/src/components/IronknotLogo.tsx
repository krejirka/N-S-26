import { usePrefersDark } from "@/hooks/usePrefersDark";

interface IronknotLogoProps {
  /** Compact mark in the header vs. full splash animation. */
  size?: "header" | "splash";
  /** Force a variant; default follows the surface (light chrome vs system splash). */
  surface?: "light" | "dark" | "auto";
  className?: string;
}

export default function IronknotLogo({ size = "header", surface = "auto", className = "" }: IronknotLogoProps) {
  const prefersDark = usePrefersDark();
  const dark = surface === "auto" ? prefersDark : surface === "dark";
  const src = `${import.meta.env.BASE_URL}ironknot-logo-${dark ? "dark" : "light"}.gif`;
  const box =
    size === "splash"
      ? "h-52 w-52 sm:h-64 sm:w-64"
      : "h-14 w-14 shrink-0 sm:h-16 sm:w-16";

  return (
    <img
      src={src}
      alt="Ironknot"
      className={`${box} object-contain ${className}`}
    />
  );
}
