import { useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Fish, Fuel, Hospital, PawPrint, Phone, X, Zap } from "lucide-react";
import NavigateButton from "./NavigateButton";
import { dayRouteGeometry, rankByCorridor } from "@/lib/corridorFilter";
import { feeBadge, stallsLabel } from "@/lib/evChargerLabels";
import { useEvAvailability } from "@/hooks/useEvAvailability";
import type { CorridorPoi, EvCharger, EvLiveStatus, Place, RouteSegment, TripDay } from "@/types/trip";
import type { FishingSpot } from "@/types/trip";

const FISH_KM = 20;
const SERVICE_KM = 50;
const CHARGER_KM = 25;
const FUEL_KM = 20;

type PanelKind = "fish" | "hospital" | "vet" | "tesla" | "chargerOther" | "fuel" | null;

interface DayServicesPanelProps {
  day: TripDay;
  segments: RouteSegment[];
  daySegments: Record<string, string[]>;
  corridorPois: CorridorPoi[];
  evChargers?: EvCharger[];
  fishingSpots: FishingSpot[];
  /** Day destination — center for live EV availability. */
  placeCoords?: Place | null;
}

export default function DayServicesPanel({
  day,
  segments,
  daySegments,
  corridorPois,
  evChargers = [],
  fishingSpots,
  placeCoords = null,
}: DayServicesPanelProps) {
  const [open, setOpen] = useState<PanelKind>("tesla");

  const geometry = useMemo(() => {
    const ids = new Set(daySegments[String(day.day)] || []);
    return dayRouteGeometry(segments, ids);
  }, [day.day, daySegments, segments]);

  const fish = useMemo(
    () => rankByCorridor(fishingSpots, geometry, FISH_KM),
    [fishingSpots, geometry]
  );

  const fuels = useMemo(
    () =>
      rankByCorridor(
        corridorPois.filter((p) => p.kind === "fuel"),
        geometry,
        FUEL_KM
      ),
    [corridorPois, geometry]
  );

  const chargers = useMemo(
    () => rankByCorridor(evChargers, geometry, CHARGER_KM),
    [evChargers, geometry]
  );
  const teslaChargers = useMemo(() => chargers.filter((c) => c.tesla), [chargers]);
  const otherChargers = useMemo(() => chargers.filter((c) => !c.tesla), [chargers]);

  const hospitals = useMemo(
    () =>
      rankByCorridor(
        corridorPois.filter((p) => p.kind === "hospital" && p.emergency),
        geometry,
        SERVICE_KM
      ),
    [corridorPois, geometry]
  );

  const vets = useMemo(
    () =>
      rankByCorridor(
        corridorPois.filter((p) => p.kind === "veterinary" && p.emergency),
        geometry,
        SERVICE_KM
      ),
    [corridorPois, geometry]
  );

  const evCenter = placeCoords ? { lat: placeCoords.lat, lng: placeCoords.lng } : null;
  const evLive = useEvAvailability(evChargers, evCenter, {
    enabled: open === "tesla" || open === "chargerOther",
    radiusM: 35000,
  });

  const toggle = (kind: PanelKind) => setOpen((cur) => (cur === kind ? null : kind));

  const hasAny =
    fish.length > 0 ||
    hospitals.length > 0 ||
    vets.length > 0 ||
    teslaChargers.length > 0 ||
    otherChargers.length > 0 ||
    fuels.length > 0;
  if (!hasAny && !geometry.length) return null;

  // Default open Tesla when available; otherwise leave closed
  const effectiveOpen =
    open === "tesla" && teslaChargers.length === 0 ? null : open;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {fish.length > 0 && (
          <IconToggle
            active={effectiveOpen === "fish"}
            label={`Rybaření (${fish.length})`}
            title="Rybářská místa podél trasy"
            onClick={() => toggle("fish")}
          >
            <Fish className="h-4 w-4" />
          </IconToggle>
        )}
        {teslaChargers.length > 0 && (
          <IconToggle
            active={effectiveOpen === "tesla"}
            label={`Tesla SC (${teslaChargers.length})`}
            title="Tesla Superchargery — volné stojany online"
            onClick={() => toggle("tesla")}
          >
            <Zap className="h-4 w-4" />
          </IconToggle>
        )}
        {otherChargers.length > 0 && (
          <IconToggle
            active={effectiveOpen === "chargerOther"}
            label={`Ostatní EV (${otherChargers.length})`}
            title="Ostatní DC nabíječky podél trasy"
            onClick={() => toggle("chargerOther")}
          >
            <Zap className="h-4 w-4" />
          </IconToggle>
        )}
        {fuels.length > 0 && (
          <IconToggle
            active={effectiveOpen === "fuel"}
            label={`Benzínky (${fuels.length})`}
            title="Čerpací stanice podél trasy"
            onClick={() => toggle("fuel")}
          >
            <Fuel className="h-4 w-4" />
          </IconToggle>
        )}
        {hospitals.length > 0 && (
          <IconToggle
            active={effectiveOpen === "hospital"}
            label={`Nemocnice (${hospitals.length})`}
            title="Nemocnice s pohotovostí"
            onClick={() => toggle("hospital")}
          >
            <Hospital className="h-4 w-4" />
          </IconToggle>
        )}
        {vets.length > 0 && (
          <IconToggle
            active={effectiveOpen === "vet"}
            label={`Veterina (${vets.length})`}
            title="Veterinární pohotovost"
            onClick={() => toggle("vet")}
          >
            <PawPrint className="h-4 w-4" />
          </IconToggle>
        )}
      </div>

      {effectiveOpen === "fish" && (
        <ServiceList title="Rybaření podél trasy (≤20 km)" onClose={() => setOpen(null)}>
          {fish.map((spot) => (
            <li key={spot.id} className="border-b border-border py-2.5 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{spot.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {spot.distanceKm} km · {spot.country}
                  </div>
                  {spot.species?.length ? (
                    <div className="mt-0.5 text-xs text-teal-800">{spot.species.join(", ")}</div>
                  ) : null}
                  <p className="mt-1 text-xs leading-snug text-foreground/90">{spot.tip}</p>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <a
                  href={spot.permitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
                >
                  {spot.permitLabel}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <NavigateButton lat={spot.lat} lng={spot.lng} label={spot.name} variant="link" />
              </div>
            </li>
          ))}
        </ServiceList>
      )}

      {effectiveOpen === "tesla" && (
        <ServiceList
          title={`Tesla Superchargery (≤25 km)${evLive.live ? " · živá kapacita" : ""}`}
          onClose={() => setOpen(null)}
        >
          {teslaChargers.map((c) => (
            <ChargerRow key={c.id} charger={c} live={evLive.byId[c.id]} />
          ))}
        </ServiceList>
      )}

      {effectiveOpen === "chargerOther" && (
        <ServiceList title="Ostatní EV nabíječky (≤25 km, DC)" onClose={() => setOpen(null)}>
          {otherChargers.map((c) => (
            <ChargerRow key={c.id} charger={c} live={evLive.byId[c.id]} />
          ))}
        </ServiceList>
      )}

      {effectiveOpen === "fuel" && (
        <ServiceList title="Čerpací stanice (≤20 km)" onClose={() => setOpen(null)}>
          {fuels.map((poi) => (
            <ServicePoiRow key={poi.id} poi={poi} />
          ))}
        </ServiceList>
      )}

      {effectiveOpen === "hospital" && (
        <ServiceList title="Nemocnice s pohotovostí (≤50 km)" onClose={() => setOpen(null)}>
          {hospitals.map((poi) => (
            <ServicePoiRow key={poi.id} poi={poi} />
          ))}
        </ServiceList>
      )}

      {effectiveOpen === "vet" && (
        <ServiceList title="Veterinární pohotovost (≤50 km)" onClose={() => setOpen(null)}>
          {vets.map((poi) => (
            <ServicePoiRow key={poi.id} poi={poi} />
          ))}
        </ServiceList>
      )}
    </div>
  );
}

function ChargerRow({
  charger,
  live,
}: {
  charger: EvCharger & { distanceKm: number };
  live?: EvLiveStatus;
}) {
  const stalls = stallsLabel(charger, live);
  const fee = feeBadge(charger);
  return (
    <li className="border-b border-border py-2.5 last:border-0">
      <div className="text-sm font-semibold">{charger.name}</div>
      <div className="text-xs text-muted-foreground">
        {charger.distanceKm} km · {charger.powerLabel}
        {charger.tesla ? " · Tesla" : ""}
      </div>
      {stalls ? (
        <div className={`mt-0.5 text-xs font-semibold ${live?.live ? "text-emerald-700" : "text-foreground/90"}`}>
          {stalls}
          {live?.live ? " (živě)" : ""}
        </div>
      ) : null}
      {fee ? (
        <div className={`mt-0.5 text-xs ${fee.free ? "font-semibold text-emerald-700" : "text-foreground/80"}`}>
          {fee.text}
        </div>
      ) : null}
      {charger.sockets ? <div className="mt-0.5 text-xs text-foreground/80">{charger.sockets}</div> : null}
      <div className="mt-0.5 text-xs text-foreground/90">Otevírací doba: {charger.openingHoursLabel}</div>
      {charger.address ? <div className="mt-0.5 text-xs text-foreground/80">{charger.address}</div> : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {charger.website ? (
          <a
            href={charger.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
          >
            Web
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        <NavigateButton lat={charger.lat} lng={charger.lng} label={charger.name} variant="link">
          Navigovat k nabíječce
        </NavigateButton>
      </div>
    </li>
  );
}

function IconToggle({
  active,
  label,
  title,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted"
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function ServiceList({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-2 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <button
          type="button"
          aria-label="Zavřít"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="max-h-64 overflow-y-auto">{children}</ul>
    </div>
  );
}

function ServicePoiRow({
  poi,
}: {
  poi: CorridorPoi & { distanceKm: number };
}) {
  return (
    <li className="border-b border-border py-2.5 last:border-0">
      <div className="text-sm font-semibold">{poi.name}</div>
      <div className="text-xs text-muted-foreground">{poi.distanceKm} km od trasy</div>
      {poi.address && <div className="mt-0.5 text-xs text-foreground/80">{poi.address}</div>}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {poi.phone && (
          <a
            href={`tel:${poi.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
          >
            <Phone className="h-3 w-3" />
            {poi.phone}
          </a>
        )}
        {poi.website && (
          <a
            href={poi.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline"
          >
            Web
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <NavigateButton lat={poi.lat} lng={poi.lng} label={poi.name} variant="link" />
      </div>
      {!poi.phone && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          Tísňová linka EU: <a href="tel:112" className="underline">112</a>
        </div>
      )}
    </li>
  );
}
