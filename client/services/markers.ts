declare const mapboxgl: any;

import { MAX_MARKERS, STORAGE_KEY } from "../constants.js";
import { markerList } from "../dom/elements.js";
import type { MarkerData, MarkerRecord } from "../types.js";
import { getMap } from "./map.js";
import { setStatus } from "./status.js";

let markers: Set<MarkerRecord> = new Set();

function markerArray(): MarkerRecord[] {
  return Array.from(markers);
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function markerKey(label: string, latitude: number, longitude: number): string {
  return `${normalizeLabel(label)}|${latitude.toFixed(6)}|${longitude.toFixed(6)}`;
}

function hasMarker(
  label: string,
  latitude: number,
  longitude: number,
): boolean {
  const key = markerKey(label, latitude, longitude);
  for (const marker of markers) {
    if (markerKey(marker.label, marker.latitude, marker.longitude) === key) {
      return true;
    }
  }
  return false;
}

function saveMarkers(): void {
  const serialized = markerArray().map(
    ({ id, label, latitude, longitude }) => ({
      id,
      label,
      latitude,
      longitude,
    }),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function createMarkerInstance(data: MarkerData): any {
  const element = document.createElement("div");
  element.className = "precise-marker";
  return new mapboxgl.Marker({ element, anchor: "center" })
    .setLngLat([data.longitude, data.latitude])
    .addTo(getMap());
}

function removeMarkerById(id: string): void {
  for (const marker of markers) {
    if (marker.id === id) {
      marker.instance.remove();
      markers.delete(marker);
      saveMarkers();
      renderMarkerList();
      return;
    }
  }
}

function renderMarkerList(): void {
  markerList.innerHTML = "";
  const list = markerArray();
  if (list.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "marker-list-empty";
    emptyItem.textContent = "No markers yet.";
    markerList.append(emptyItem);
    return;
  }
  [...list].reverse().forEach((marker) => {
    const item = document.createElement("li");
    item.className = "marker-item";
    const text = document.createElement("span");
    text.textContent = `${marker.label} (${marker.latitude.toFixed(6)}, ${marker.longitude.toFixed(6)})`;
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "marker-delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      removeMarkerById(marker.id);
      setStatus(`Marker removed: ${marker.label}`);
    });
    item.append(text, deleteButton);
    markerList.append(item);
  });
}

export function addMarker(data: Omit<MarkerData, "id">): boolean {
  if (!isValidCoordinate(data.latitude, data.longitude)) {
    return false;
  }
  if (hasMarker(data.label, data.latitude, data.longitude)) {
    return false;
  }
  const markerData: MarkerData = { id: crypto.randomUUID(), ...data };
  const instance = createMarkerInstance(markerData);
  markers.add({ ...markerData, instance });
  while (markers.size > MAX_MARKERS) {
    const oldest = markers.values().next().value as MarkerRecord | undefined;
    if (!oldest) {
      break;
    }
    oldest?.instance.remove();
    markers.delete(oldest);
  }
  saveMarkers();
  renderMarkerList();
  return true;
}

export function restoreMarkers(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    renderMarkerList();
    return;
  }
  try {
    const parsed = JSON.parse(raw) as MarkerData[];
    parsed.forEach((marker) => {
      if (
        typeof marker.id === "string" &&
        typeof marker.label === "string" &&
        typeof marker.latitude === "number" &&
        typeof marker.longitude === "number" &&
        isValidCoordinate(marker.latitude, marker.longitude) &&
        !hasMarker(marker.label, marker.latitude, marker.longitude)
      ) {
        const instance = createMarkerInstance(marker);
        markers.add({ ...marker, instance });
      }
    });
    while (markers.size > MAX_MARKERS) {
      const oldest = markers.values().next().value as MarkerRecord | undefined;
      if (!oldest) {
        break;
      }
      oldest?.instance.remove();
      markers.delete(oldest);
    }
    saveMarkers();
    renderMarkerList();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    renderMarkerList();
  }
}
