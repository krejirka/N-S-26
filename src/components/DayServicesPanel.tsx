import { useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Fish, Hospital, PawPrint, Phone, X } from "lucide-react";
import NavigateButton from "./NavigateButton";
import InlineRichText from "./InlineRichText";
import { dayRouteGeometry, rankByCorridor } from "@/lib/corridorFilter";
import type { CorridorPoi, FishingSpot, RouteSegment, TripDay } from "@/types/trip";

const FISH_KM = 20;
const SERVICE_KM = 50;

type PanelKind = "fish" | "hospital" | "vet" | null;

interface DayServicesPanelProps {
  day: TripDay;
  segments: RouteSegment[];
  daySegments: Record<string, string[]>;
  corridorPois: CorridorPoi[];
  fishingSpots: FishingSpot[];
}

export default function DayServicesPanel({
  day,
  segments,
  daySegments,
  corridorPois,
  fishingSpots,
}: DayServicesPanelProps) {
  const [open, setOpen] = useState<PanelKind>(null);

  const geometry = useMemo(() => {
    const ids = new Set(daySegments[String(day.day)] || []);
    return dayRouteGeometry(segments, ids);
  }, [day.day, daySegments, segments]);

  const fish = useMemo(
    () => rankByCorridor(fishingSpots, geometry, FISH_KM),
    [fishingSpots, geometry]
  );

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

  const toggle = (kind: PanelKind) => setOpen((cur) => (cur === kind ? null : kind));

  const hasAny = fish.length > 0 || hospitals.length > 0 || vets.length > 0;
  if (!hasAny && !geometry.length) return null;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {fish.length > 0 && (
          <IconToggle
            active={open === "fish"}
            label={`Rybaření (${fish.length})`}
            title="Rybářská místa podél trasy"
            onClick={() => toggle("fish")}
          >
            <Fish className="h-4 w-4" />
          </IconToggle>
        )}
        {hospitals.length > 0 && (
          <IconToggle
            active={open === "hospital"}
            label={`Nemocnice (${hospitals.length})`}
            title="Nemocnice s pohotovostí"
            onClick={() => toggle("hospital")}
          >
            <Hospital className="h-4 w-4" />
          </IconToggle>
        )}
        {vets.length > 0 && (
          <IconToggle
            active={open === "vet"}
            label={`Veterina (${vets.length})`}
            title="Veterinární pohotovost"
            onClick={() => toggle("vet")}
          >
            <PawPrint className="h-4 w-4" />
          </IconToggle>
        )}
      </div>

      {open === "fish" && (
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
                  <p className="mt-1 text-xs leading-snug text-foreground/90">
                    <InlineRichText text={spot.tip} />
                  </p>
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

      {open === "hospital" && (
        <ServiceList title="Nemocnice s pohotovostí (≤50 km)" onClose={() => setOpen(null)}>
          {hospitals.map((poi) => (
            <ServicePoiRow key={poi.id} poi={poi} />
          ))}
        </ServiceList>
      )}

      {open === "vet" && (
        <ServiceList title="Veterinární pohotovost (≤50 km)" onClose={() => setOpen(null)}>
          {vets.map((poi) => (
            <ServicePoiRow key={poi.id} poi={poi} />
          ))}
        </ServiceList>
      )}
    </div>
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
