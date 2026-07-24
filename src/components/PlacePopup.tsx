import { useState } from "react";
import { Popup } from "react-leaflet";
import { ExternalLink } from "lucide-react";
import YrForecast from "./YrForecast";
import { formatCoords, navigationUrl } from "@/lib/navLink";
import type { Place } from "@/types/trip";

interface PlacePopupProps {
  place: Place;
  dayLabel: string;
}

export default function PlacePopup({ place, dayLabel }: PlacePopupProps) {
  const [open, setOpen] = useState(false);
  const navHref = navigationUrl(place.lat, place.lng, place.name);

  return (
    <Popup
      minWidth={240}
      eventHandlers={{
        add: () => setOpen(true),
        remove: () => setOpen(false),
      }}
    >
      <strong>{place.name}</strong>
      <br />
      <span className="text-xs text-gray-600">{place.country}</span>
      {dayLabel && (
        <>
          <br />
          <span className="text-xs text-gray-500">Den {dayLabel}</span>
        </>
      )}
      <br />
      <span className="text-xs text-gray-500">{formatCoords(place.lat, place.lng)}</span>
      <br />
      <a
        href={navHref}
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
      >
        Navigovat
        <ExternalLink className="h-3 w-3" />
      </a>
      {open && <YrForecast lat={place.lat} lng={place.lng} />}
    </Popup>
  );
}
