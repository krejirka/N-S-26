import { Popup } from "react-leaflet";
import { ExternalLink } from "lucide-react";
import { formatCoords, navigationUrl } from "@/lib/navLink";
import type { ShopPoi } from "@/types/trip";

interface ShopPopupProps {
  shop: ShopPoi;
}

export default function ShopPopup({ shop }: ShopPopupProps) {
  const kindLabel = shop.kind === "ikea" ? "IKEA" : "Dollarstore";
  const navHref = navigationUrl(shop.lat, shop.lng, shop.name);

  return (
    <Popup minWidth={220}>
      <strong>{shop.name}</strong>
      <br />
      <span className="text-xs text-gray-600">
        {kindLabel} · {shop.country}
      </span>
      <br />
      <span className="text-xs text-gray-700">{shop.address}</span>
      <br />
      <span className="text-xs text-gray-500">{formatCoords(shop.lat, shop.lng)}</span>
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
