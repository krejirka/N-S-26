import { Marker, Popup } from "react-leaflet";
import { makeIncidentIcon } from "@/lib/incidentMarker";
import { hoverPopupHandlers } from "@/lib/hoverPopup";
import type { TrafficIncident } from "@/hooks/useDayIncidents";

interface TrafficIncidentMarkersProps {
  incidents: TrafficIncident[];
}

export default function TrafficIncidentMarkers({ incidents }: TrafficIncidentMarkersProps) {
  if (!incidents.length) return null;

  return (
    <>
      {incidents.map((inc) => {
        const roads = inc.roadNumbers?.length ? inc.roadNumbers.join(", ") : null;
        const stretch =
          inc.from && inc.to ? `${inc.from} → ${inc.to}` : inc.from || inc.to || null;
        const delayMin = inc.delaySec >= 60 ? Math.round(inc.delaySec / 60) : 0;
        return (
          <Marker
            key={inc.id}
            position={[inc.lat, inc.lng]}
            icon={makeIncidentIcon(inc.category)}
            zIndexOffset={400}
            eventHandlers={hoverPopupHandlers()}
          >
            <Popup>
              <div className="min-w-[160px] text-sm">
                <div className="font-semibold">{inc.categoryLabel}</div>
                <div className="mt-0.5 text-muted-foreground">{inc.description}</div>
                {roads && <div className="mt-1 text-xs">{roads}</div>}
                {stretch && <div className="mt-0.5 text-xs text-muted-foreground">{stretch}</div>}
                {delayMin > 0 && (
                  <div className="mt-1 text-xs font-medium">+{delayMin} min</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
