import { Download, ExternalLink } from "lucide-react";
import { downloadHikeGpx } from "@/lib/hikeGpx";
import { mapyCzTouristUrl } from "@/lib/navLink";
import type { HikingRoute } from "@/types/trip";
import ElevationProfile from "./ElevationProfile";

export default function HikingDayPanel({ hike }: { hike: HikingRoute }) {
  const mid = hike.track[Math.floor(hike.track.length / 2)];
  const mapyUrl = mid ? mapyCzTouristUrl(mid[1], mid[0], 14) : mapyCzTouristUrl(42.2, 23.58, 14);
  const profile = hike.profile;

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Turistická mapa
      </h3>
      <div className="mt-2 flex flex-col gap-3">
        <div>
          <p className="text-sm leading-relaxed">
            {hike.name} · {hike.distanceKm.toLocaleString("cs-CZ")} km po značené OSM trase
            (Мусаленска пътека).
            {profile
              ? ` Převýšení ↑ ${profile.ascentM} m / ↓ ${profile.descentM} m.`
              : ""}{" "}
            Na mapě OpenTopoMap + turistické značky; tlačítkem GPS sledujete polohu v telefonu.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadHikeGpx(hike)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Stáhnout GPX
              <Download className="h-3.5 w-3.5" />
            </button>
            <a
              href={mapyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Mapy.cz turistická
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            GPX otevřete v Mapy.cz nebo OsmAnd pro offline mapu v terénu.
          </p>
        </div>
        {profile && <ElevationProfile profile={profile} />}
      </div>
    </div>
  );
}