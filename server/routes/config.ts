import type express from "express";

export function registerConfigRoute(
  app: express.Express,
  mapboxAccessToken: string,
): void {
  app.get("/api/config", (_req, res) => {
    res.json({ mapboxAccessToken });
  });
}
