import { Popup } from "react-leaflet";
import { ExternalLink } from "lucide-react";
import { formatCoords, navigationUrl } from "@/lib/navLink";
import type { CorridorPoi, ShopPoi } from "@/types/trip";

const KIND_LABEL: Record<string, string> = {
  fuel: "Natural 95",
  hospital: "Nemocnice / pohotovost",
  veterinary: "Veterina (psi)",
  ikea: "IKEA",
  dollarstore: "Dollarstore",
};

export function GenericPoiPopup({
  name,
  kind,
  address,
  lat,
  lng,
  extra,
}: {
  name: string;
  kind: string;
  address?: string;
  lat: number;
  lng: number;
  extra?: string;
}) {
  const navHref = navigationUrl(lat, lng, name);
  return (
    <Popup minWidth={200}>
      <strong>{name}</strong>
      <br />
      <span className="text-xs text-gray-600">{KIND_LABEL[kind] || kind}</span>
      {extra ? (
        <>
          <br />
          <span className="text-xs text-gray-600">{extra}</span>
        </>
      ) : null}
      {address ? (
        <>
          <br />
          <span className="text-xs text-gray-700">{address}</span>
        </>
      ) : null}
      <br />
      <span className="text-xs text-gray-500">{formatCoords(lat, lng)}</span>
      <br />
      <a
        href={navHref}
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
      >
        Navigovat
        <ExternalLink className="h-3 w-3" />
      </a>
    </Popup>
  );
}

export function CorridorPoiPopup({ poi }: { poi: CorridorPoi }) {
  const extra =
    poi.kind === "hospital"
      ? poi.emergency
        ? "Pohotovost"
        : "Nemocnice"
      : poi.kind === "veterinary"
        ? poi.emergency
          ? "Pohotovost"
          : undefined
        : poi.fuel95
          ? "Natural 95"
          : undefined;
  return (
    <GenericPoiPopup
      name={poi.name}
      kind={poi.kind}
      address={poi.address}
      lat={poi.lat}
      lng={poi.lng}
      extra={extra}
    />
  );
}

export function ShopCorridorPopup({ shop }: { shop: ShopPoi }) {
  return (
    <GenericPoiPopup
      name={shop.name}
      kind={shop.kind}
      address={shop.address}
      lat={shop.lat}
      lng={shop.lng}
    />
  );
}
