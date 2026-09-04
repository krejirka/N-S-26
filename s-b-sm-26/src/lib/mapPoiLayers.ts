export type MapPoiLayer = "fuel" | "hospital" | "tesla" | "chargerOther" | "vet" | "border";

export type MapPoiLayerState = Record<MapPoiLayer, boolean>;

/** Corridor POI layers off by default (GPS stays separate / on in TripMap). */
export const MAP_POI_LAYERS_OFF: MapPoiLayerState = {
  fuel: false,
  hospital: false,
  tesla: false,
  chargerOther: false,
  vet: false,
  border: false,
};
