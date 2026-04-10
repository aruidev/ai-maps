import express from "express";
import path from "node:path";

export function setupApp(app: express.Express): void {
  app.use(express.json());
  app.use(express.static(path.resolve(process.cwd(), "client")));
  app.use("/dist", express.static(path.resolve(process.cwd(), "dist")));
}
