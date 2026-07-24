import { useState } from "react";
import { Popup } from "react-leaflet";
import YrForecast from "./YrForecast";
import NavigateButton from "./NavigateButton";
import { formatCoords } from "@/lib/navLink";
import type { Place } from "@/types/trip";

interface PlacePopupProps {
  place: Place;
  dayLabel: string;
}

export default function PlacePopup({ place, dayLabel }: PlacePopupProps) {
  const [open, setOpen] = useState(false);

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
      {place.address && (
        <>
          <br />
          <span className="text-xs text-gray-700">{place.address}</span>
        </>
      )}
      {dayLabel && (
        <>
          <br />
          <span className="text-xs text-gray-500">Den {dayLabel}</span>
        </>
      )}
      <br />
      <span className="text-xs text-gray-500">{formatCoords(place.lat, place.lng)}</span>
      <br />
      <NavigateButton lat={place.lat} lng={place.lng} label={place.name} variant="link" />
      {open && <YrForecast lat={place.lat} lng={place.lng} />}
    </Popup>
  );
}
