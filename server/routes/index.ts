import type express from "express";
import { registerConfigRoute } from "./config.js";
import { registerQueryRoute } from "./query.js";
import { registerRootRoute } from "./root.js";

export function registerRoutes(app: express.Express, mapboxAccessToken: string): void {
	registerRootRoute(app);
	registerConfigRoute(app, mapboxAccessToken);
	registerQueryRoute(app);
}
