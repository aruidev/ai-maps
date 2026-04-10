import { requiredEnv } from "./environment.js";

export type RuntimeConfig = {
  mapboxAccessToken: string;
  port: number;
};

export function getRuntimeConfig(): RuntimeConfig {
  const mapboxAccessToken = requiredEnv("MAPBOX_ACCESS_TOKEN");
  requiredEnv("GITHUB_TOKEN");
  const port = Number(process.env.PORT ?? "3000");
  return { mapboxAccessToken, port };
}
