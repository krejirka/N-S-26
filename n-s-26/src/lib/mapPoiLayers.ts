export type MapPoiLayer = "fuel" | "hospital" | "charger" | "vet" | "border";

export type MapPoiLayerState = Record<MapPoiLayer, boolean>;

export const MAP_POI_LAYERS_OFF: MapPoiLayerState = {
  fuel: false,
  hospital: false,
  charger: false,
  vet: false,
  border: false,
};
