declare const mapboxgl: any;

type GeoSuccess = {
	ok: true;
	label: string;
	latitude: number;
	longitude: number;
	message: string;
};

type GeoFailure = {
	ok: false;
	message: string;
};

type GeoResult = GeoSuccess | GeoFailure;

type MarkerData = {
	id: string;
	label: string;
	latitude: number;
	longitude: number;
};

type MarkerRecord = MarkerData & {
	instance: any;
};

const STORAGE_KEY = "ai-maps-markers";
const MAX_MARKERS = 10;

function requireElement<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (!element) {
		throw new Error(`Missing required DOM element: ${selector}`);
	}
	return element;
}

const queryForm = requireElement<HTMLFormElement>("#query-form");
const systemInfoInput = requireElement<HTMLTextAreaElement>("#system-info");
const messageInput = requireElement<HTMLInputElement>("#message");
const placeMarkerButton = requireElement<HTMLButtonElement>("#place-marker");
const themeToggleButton = requireElement<HTMLButtonElement>("#theme-toggle");
const statusNode = requireElement<HTMLElement>("#status");
const markerList = requireElement<HTMLUListElement>("#marker-list");
const chatLog = requireElement<HTMLUListElement>("#chat-log");

const THEME_STORAGE_KEY = "ai-maps-theme";

let map: any;
let lastResult: GeoSuccess | null = null;
let markers: MarkerRecord[] = [];

function setTheme(theme: "light" | "dark"): void {
	document.body.dataset.theme = theme;
	document.body.classList.toggle("light-theme", theme === "light");
	document.body.classList.toggle("dark-theme", theme === "dark");
	themeToggleButton.textContent =
		theme === "light" ? "🌙 Dark theme" : "☀️ Light theme";
	localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function initializeTheme(): void {
	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
	const initialTheme = storedTheme === "dark" ? "dark" : "light";
	setTheme(initialTheme);
}

function setStatus(text: string, isError = false): void {
	statusNode.textContent = text;
	statusNode.classList.toggle("error", isError);
}

function appendChatEntry(role: "user" | "assistant", text: string): void {
	const item = document.createElement("li");
	item.className = `chat-entry ${role}`;
	item.textContent = text;
	chatLog.prepend(item);
}

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
		.addTo(map);
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

	const entries = [...markers].reverse();
	entries.forEach((marker) => {
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

function addMarker(data: Omit<MarkerData, "id">): void {
	const markerData: MarkerData = {
		id: crypto.randomUUID(),
		...data,
	};

	const instance = createMarkerInstance(markerData);
	markers.push({ ...markerData, instance });

	while (markers.length > MAX_MARKERS) {
		const oldest = markers.shift();
		oldest?.instance.remove();
	}

	saveMarkers();
	renderMarkerList();
}

function restoreMarkers(): void {
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
				isValidCoordinate(marker.latitude, marker.longitude)
			) {
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

async function fetchConfig(): Promise<{ mapboxAccessToken: string }> {
	const response = await fetch("/api/config");
	if (!response.ok) {
		throw new Error("Failed to load map configuration");
	}
	return (await response.json()) as { mapboxAccessToken: string };
}

async function sendQuery(message: string, systemInfo: string): Promise<GeoResult> {
	const response = await fetch("/api/query", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ message, systemInfo }),
	});

	return (await response.json()) as GeoResult;
}

async function initialize(): Promise<void> {
	setStatus("Loading map...");
	const config = await fetchConfig();

	mapboxgl.accessToken = config.mapboxAccessToken;
	map = new mapboxgl.Map({
		container: "map",
		style: "mapbox://styles/mapbox/streets-v12",
		center: [2.1734, 41.3851],
		zoom: 2,
	});

	map.on("load", () => {
		restoreMarkers();
		setStatus("Map ready. Enter a geographic query.");
	});
}

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
		map.flyTo({ center: [result.longitude, result.latitude], zoom: 9 });
	} catch {
		setStatus("Could not complete the query.", true);
	}
});

placeMarkerButton.addEventListener("click", () => {
	if (!lastResult) {
		setStatus("You need a valid query with coordinates first.", true);
		return;
	}

	addMarker({
		label: lastResult.label,
		latitude: lastResult.latitude,
		longitude: lastResult.longitude,
	});

	map.flyTo({ center: [lastResult.longitude, lastResult.latitude], zoom: 11 });
	setStatus(
		`Marker placed at ${lastResult.latitude.toFixed(6)}, ${lastResult.longitude.toFixed(6)}. Max ${MAX_MARKERS}.`
	);
});

themeToggleButton.addEventListener("click", () => {
	const currentTheme = document.body.dataset.theme === "dark" ? "dark" : "light";
	setTheme(currentTheme === "light" ? "dark" : "light");
});

initializeTheme();

void initialize().catch(() => {
	setStatus("Error initializing the map.", true);
});
