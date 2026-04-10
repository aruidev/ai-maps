import { MAX_MARKERS } from "../constants.js";
import { messageInput, placeMarkerButton, queryForm, systemInfoInput, themeToggleButton } from "../dom/elements.js";
import { sendQuery } from "../services/api.js";
import { appendChatEntry } from "../services/chat.js";
import { flyToLocation } from "../services/map.js";
import { addMarker } from "../services/markers.js";
import { setStatus } from "../services/status.js";
import { setTheme } from "../services/theme.js";
import type { GeoSuccess } from "../types.js";

export function setupEventListeners(): void {
	let lastResult: GeoSuccess | null = null;

	queryForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const message = messageInput.value.trim();
		const systemInfo = systemInfoInput.value.trim();
		if (!message) {
			setStatus("Enter a query.", true);
			return;
		}
		appendChatEntry("user", message);
		setStatus("Querying OpenAI...");
		try {
			const result = await sendQuery(message, systemInfo);
			if (!result.ok) {
				setStatus(result.message, true);
				appendChatEntry("assistant", result.message);
				lastResult = null;
				return;
			}
			lastResult = result;
			setStatus(`Result: ${result.label} (${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)})`);
			appendChatEntry("assistant", `${result.message} (${result.latitude}, ${result.longitude})`);
			flyToLocation(result.longitude, result.latitude, 9);
		} catch {
			setStatus("Could not complete the query.", true);
		}
	});

	placeMarkerButton.addEventListener("click", () => {
		if (!lastResult) {
			setStatus("You need a valid query with coordinates first.", true);
			return;
		}
		const added = addMarker({ label: lastResult.label, latitude: lastResult.latitude, longitude: lastResult.longitude });
		if (!added) {
			setStatus("Duplicate marker: same place and coordinates already exists.", true);
			return;
		}
		flyToLocation(lastResult.longitude, lastResult.latitude, 11);
		setStatus(`Marker placed at ${lastResult.latitude.toFixed(6)}, ${lastResult.longitude.toFixed(6)}. Max ${MAX_MARKERS}.`);
	});

	themeToggleButton.addEventListener("click", () => {
		const currentTheme = document.body.dataset.theme === "dark" ? "dark" : "light";
		setTheme(currentTheme === "light" ? "dark" : "light");
	});
}
