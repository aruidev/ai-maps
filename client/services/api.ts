import type { GeoResult } from "../types.js";

export async function fetchConfig(): Promise<{ mapboxAccessToken: string }> {
	const response = await fetch("/api/config");
	if (!response.ok) {
		throw new Error("Failed to load map configuration");
	}
	return (await response.json()) as { mapboxAccessToken: string };
}

export async function sendQuery(message: string, systemInfo: string): Promise<GeoResult> {
	const response = await fetch("/api/query", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ message, systemInfo }),
	});

	return (await response.json()) as GeoResult;
}
