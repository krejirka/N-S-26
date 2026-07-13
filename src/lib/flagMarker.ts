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
  const wide = dayLabel.length > 3;
  const width = wide ? 30 : 24;
  const height = 26;

  return L.divIcon({
    className: "",
    html: `<div class="trip-flag-marker${active ? " is-active" : ""}" style="width:${width}px">
      <img class="flag-img" src="https://flagcdn.com/w20/${code}.png" width="14" height="10" alt="" loading="lazy" />
      ${dayLabel ? `<span class="day-badge">${dayLabel}</span>` : ""}
    </div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 2],
  });
}
