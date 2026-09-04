import type { MapPoiLayer, MapPoiLayerState } from "@/lib/mapPoiLayers";

const LAYER_BTNS: { id: MapPoiLayer; label: string; title: string }[] = [
  { id: "fuel", label: "Benzínky", title: "Čerpací stanice podél trasy (vypnuto ve výchozím zobrazení)" },
  {
    id: "tesla",
    label: "Tesla SC",
    title: "Tesla Superchargery — volné stojany online přes TomTom",
  },
  {
    id: "chargerOther",
    label: "Ostatní EV",
    title: "Ostatní DC nabíječky (výkon, počet, zdarma/placené)",
  },
  { id: "hospital", label: "Nemocnice", title: "Nemocnice s pohotovostí podél trasy" },
  { id: "vet", label: "Veterina", title: "Veterinární pohotovost podél trasy" },
  { id: "border", label: "Přechody", title: "Hraniční přechody ZOLL (plánované i alternativy do 90 min)" },
];

const BTN =
  "rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-md backdrop-blur-sm transition";

export default function MapPoiLayerToggles({
  layers,
  available,
  onToggle,
}: {
  layers: MapPoiLayerState;
  available: MapPoiLayerState;
  onToggle: (id: MapPoiLayer) => void;
}) {
  const items = LAYER_BTNS.filter((b) => available[b.id]);
  if (!items.length) return null;

  return (
    <>
      {items.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onToggle(b.id)}
          className={`${BTN} ${
            layers[b.id]
              ? "border-slate-700 bg-slate-800 text-white"
              : "border-border bg-card/95 text-foreground hover:bg-muted"
          }`}
          title={b.title}
        >
          {b.label}
        </button>
      ))}
    </>
  );
}
