import type express from "express";
import path from "node:path";

export function registerRootRoute(app: express.Express): void {
  app.get("/", (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), "client", "index.html"));
  });
}
