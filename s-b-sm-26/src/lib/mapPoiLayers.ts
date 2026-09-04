export type MapPoiLayer = "fuel" | "hospital" | "tesla" | "chargerOther" | "vet" | "border";

export type MapPoiLayerState = Record<MapPoiLayer, boolean>;

/** Tesla Superchargers on by default; other corridor layers stay off. */
export const MAP_POI_LAYERS_OFF: MapPoiLayerState = {
  fuel: false,
  hospital: false,
  tesla: true,
  chargerOther: false,
  vet: false,
  border: false,
};
