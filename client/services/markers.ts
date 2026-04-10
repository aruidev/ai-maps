declare const mapboxgl: any;

import { MAX_MARKERS, STORAGE_KEY } from "../constants.js";
import { markerList } from "../dom/elements.js";
import type { MarkerData, MarkerRecord } from "../types.js";
import { getMap } from "./map.js";
import { setStatus } from "./status.js";

let markers: MarkerRecord[] = [];

function saveMarkers(): void {
	const serialized = markers.map(({ id, label, latitude, longitude }) => ({
		id,
		label,
		latitude,
		longitude,
	}));
	localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
	return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function createMarkerInstance(data: MarkerData): any {
	const element = document.createElement("div");
	element.className = "precise-marker";
	return new mapboxgl.Marker({ element, anchor: "center" }).setLngLat([data.longitude, data.latitude]).addTo(getMap());
}

function removeMarkerById(id: string): void {
	const index = markers.findIndex((marker) => marker.id === id);
	if (index === -1) {
		return;
	}
	markers[index].instance.remove();
	markers.splice(index, 1);
	saveMarkers();
	renderMarkerList();
}

function renderMarkerList(): void {
	markerList.innerHTML = "";
	if (markers.length === 0) {
		const emptyItem = document.createElement("li");
		emptyItem.className = "marker-list-empty";
		emptyItem.textContent = "No markers yet.";
		markerList.append(emptyItem);
		return;
	}
	[...markers].reverse().forEach((marker) => {
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

export function addMarker(data: Omit<MarkerData, "id">): void {
	const markerData: MarkerData = { id: crypto.randomUUID(), ...data };
	const instance = createMarkerInstance(markerData);
	markers.push({ ...markerData, instance });
	while (markers.length > MAX_MARKERS) {
		const oldest = markers.shift();
		oldest?.instance.remove();
	}
	saveMarkers();
	renderMarkerList();
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
			if (typeof marker.id === "string" && typeof marker.label === "string" && typeof marker.latitude === "number" && typeof marker.longitude === "number" && isValidCoordinate(marker.latitude, marker.longitude)) {
				const instance = createMarkerInstance(marker);
				markers.push({ ...marker, instance });
			}
		});
		while (markers.length > MAX_MARKERS) {
			const oldest = markers.shift();
			oldest?.instance.remove();
		}
		saveMarkers();
		renderMarkerList();
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		renderMarkerList();
	}
}
