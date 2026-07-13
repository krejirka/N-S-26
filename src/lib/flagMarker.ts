import L from "leaflet";

const FLAG_CODES: Record<string, string> = {
  Česko: "cz",
  Německo: "de",
  Norsko: "no",
  Švédsko: "se",
};

export function countryFlagCode(country: string) {
  return FLAG_CODES[country] ?? "un";
}

export function makeFlagIcon(country: string, dayLabel: string, active: boolean) {
  const code = countryFlagCode(country);
  const wide = dayLabel.length > 2;
  const width = wide ? 44 : 40;
  const height = 52;

  return L.divIcon({
    className: "",
    html: `<div class="trip-flag-marker${active ? " is-active" : ""}" style="width:${width}px">
      <div class="flag-pole"></div>
      <img class="flag-img" src="https://flagcdn.com/w80/${code}.png" width="28" height="19" alt="${country}" loading="lazy" />
      ${dayLabel ? `<span class="day-badge">${dayLabel}</span>` : ""}
    </div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 4],
  });
}
