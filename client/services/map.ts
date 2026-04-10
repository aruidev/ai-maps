declare const mapboxgl: any;

import { fetchConfig } from "./api.js";
import { setStatus } from "./status.js";

let map: any;

export function getMap(): any {
  if (!map) {
    throw new Error("Map is not initialized yet");
  }
  return map;
}

export function flyToLocation(
  longitude: number,
  latitude: number,
  zoom: number,
): void {
  getMap().flyTo({ center: [longitude, latitude], zoom });
}

export async function initializeMap(onLoad: () => void): Promise<void> {
  setStatus("Loading map...");
  const config = await fetchConfig();

  mapboxgl.accessToken = config.mapboxAccessToken;
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [2.1734, 41.3851],
    zoom: 2,
  });

  map.on("load", onLoad);
}
