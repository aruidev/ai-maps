import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

export function loadEnvironment(): void {
  const environmentDir = path.resolve(process.cwd(), "environments");
  const localPath = path.join(environmentDir, ".env.local");
  const prodPath = path.join(environmentDir, ".env.prod");
  const defaultPath = path.resolve(process.cwd(), ".env");

  if (fs.existsSync(defaultPath)) {
    dotenv.config({ path: defaultPath });
  }
  if (process.env.NODE_ENV === "production" && fs.existsSync(prodPath)) {
    dotenv.config({ path: prodPath, override: true });
  }
  if (fs.existsSync(localPath)) {
    dotenv.config({
      path: localPath,
      override: process.env.NODE_ENV !== "production",
    });
  }
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
