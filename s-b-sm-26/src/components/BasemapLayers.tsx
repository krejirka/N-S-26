import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import type { Layer, LatLngBoundsExpression } from "leaflet";
import { leafletLayer } from "protomaps-leaflet";
import { IS_NATIVE } from "@/lib/runtime";
import { nativePmtiles, probeNativePmtiles } from "@/lib/capacitorPmtiles";

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const HIKE_BOUNDS: LatLngBoundsExpression = [
  [42.044443, 23.395889],
  [42.361687, 23.771282],
];

function OsmBasemap({ topoOn }: { topoOn: boolean }) {
  if (topoOn) {
    return (
      <>
        <TileLayer attribution={OSM_ATTR} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <TileLayer
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          maxZoom={17}
          opacity={0.92}
        />
        <TileLayer
          attribution='Hiking overlay &copy; <a href="https://waymarkedtrails.org">Waymarked Trails</a>'
          url="https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"
          opacity={0.9}
          maxZoom={18}
        />
      </>
    );
  }
  return <TileLayer attribution={OSM_ATTR} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />;
}

/** DOM banner attached to the map container (safe inside MapContainer). */
function MapBanner({ text, tone }: { text: string; tone: "info" | "error" }) {
  const map = useMap();
  useEffect(() => {
    const el = document.createElement("div");
    el.textContent = text;
    el.setAttribute("role", "status");
    el.style.cssText = [
      "position:absolute",
      "top:12px",
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:1000",
      "max-width:90%",
      "padding:8px 12px",
      "border-radius:8px",
      "font-size:12px",
      "text-align:center",
      "color:#fff",
      "pointer-events:none",
      tone === "error" ? "background:rgba(185,28,28,0.92)" : "background:rgba(23,23,23,0.85)",
    ].join(";");
    const parent = map.getContainer();
    parent.appendChild(el);
    return () => {
      el.remove();
    };
  }, [map, text, tone]);
  return null;
}

function NativeProtomapsLayer({
  path,
  maxDataZoom,
  maxZoom,
  minZoom,
  bounds,
  overlay,
  clearBackground,
}: {
  path: string;
  maxDataZoom: number;
  maxZoom: number;
  minZoom?: number;
  bounds?: LatLngBoundsExpression;
  overlay?: boolean;
  clearBackground?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    let layer: (Layer & { backgroundColor?: string }) | null = null;

    (async () => {
      try {
        const archive = nativePmtiles(path);
        const header = await archive.getHeader();
        if (cancelled) return;
        console.info("[Basemap] ready", path, `z${header.minZoom}-${header.maxZoom}`);

        layer = leafletLayer({
          url: archive as never,
          flavor: "light",
          lang: "cs",
          attribution: OSM_ATTR + " · Protomaps offline",
          maxZoom,
          maxDataZoom,
          ...(minZoom != null ? { minZoom } : {}),
          ...(bounds ? { bounds } : {}),
          ...(overlay || clearBackground ? { backgroundColor: undefined } : {}),
        }) as unknown as Layer & { backgroundColor?: string };

        if (overlay || clearBackground) layer.backgroundColor = undefined;
        layer.addTo(map);
      } catch (err) {
        console.error("[Basemap] failed", path, err);
      }
    })();

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, path, maxDataZoom, maxZoom, minZoom, bounds, overlay, clearBackground]);

  return null;
}

interface BasemapLayersProps {
  online: boolean;
  topoOn: boolean;
}

/**
 * Website → OSM/OTM.
 * Native → basemap.pmtiles (z0–14) via native PmtilesAsset (works offline).
 * OSM underlay when online. Hike overlay for Musala when topoOn.
 *
 * Offline is primary: packed layers always mount (unless probe hard-fails).
 * Online OSM is underlay only — never the only basemap on native.
 */
export default function BasemapLayers({ online, topoOn }: BasemapLayersProps) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">(IS_NATIVE ? "loading" : "ok");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!IS_NATIVE) return;
    let alive = true;
    (async () => {
      const probe = await probeNativePmtiles("offline/basemap.pmtiles");
      if (!alive) return;
      setStatus(probe.ok ? "ok" : "error");
      setDetail(probe.detail);
      if (probe.ok) {
        // Warm hike archive in background so Musala opens faster.
        void probeNativePmtiles("offline/hike.pmtiles");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!IS_NATIVE) {
    return <OsmBasemap topoOn={topoOn} />;
  }

  const showPacked = status !== "error";

  return (
    <>
      {online && <OsmBasemap topoOn={topoOn} />}

      {showPacked && (
        <NativeProtomapsLayer
          path="offline/basemap.pmtiles"
          minZoom={0}
          maxZoom={18}
          maxDataZoom={14}
          clearBackground={online}
        />
      )}

      {/* Musala z13–15 lives only in hike.pmtiles — always mount on native. */}
      {showPacked && (
        <NativeProtomapsLayer
          path="offline/hike.pmtiles"
          minZoom={10}
          maxZoom={18}
          maxDataZoom={15}
          bounds={HIKE_BOUNDS}
          overlay
        />
      )}

      {status === "loading" && (
        <MapBanner
          text={
            online
              ? "Načítám offline mapu…"
              : "Připravuji offline mapu (první spuštění může chvíli trvat)…"
          }
          tone="info"
        />
      )}
      {status === "error" && !online && (
        <MapBanner text={`Offline mapa selhala: ${detail || "neznámá chyba"}`} tone="error" />
      )}
      {status === "error" && online && (
        <MapBanner text={`Offline balíček nedostupný (${detail}) — online dlaždice`} tone="info" />
      )}
    </>
  );
}
