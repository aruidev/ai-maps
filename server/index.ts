import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { generateResponse } from "./openai/openai.js";

function loadEnvironment(): void {
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
		dotenv.config({ path: localPath, override: process.env.NODE_ENV !== "production" });
	}
}

function requiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

loadEnvironment();

const mapboxAccessToken = requiredEnv("MAPBOX_ACCESS_TOKEN");
requiredEnv("GITHUB_TOKEN");

const app = express();
const port = Number(process.env.PORT ?? "3000");

app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), "client")));
app.use("/dist", express.static(path.resolve(process.cwd(), "dist")));

app.get("/", (_req, res) => {
	res.sendFile(path.resolve(process.cwd(), "client", "index.html"));
});

app.get("/api/config", (_req, res) => {
	res.json({ mapboxAccessToken });
});

app.post("/api/query", async (req, res, next) => {
	try {
		const body = req.body as { message?: string; systemInfo?: string };
		if (!body.message || body.message.trim().length === 0) {
			res.status(400).json({ ok: false, message: "Missing message field" });
			return;
		}

		const result = await generateResponse(body.message, body.systemInfo);
		if (!result.ok) {
			res.status(422).json(result);
			return;
		}

		res.json(result);
	} catch (error) {
		next(error);
	}
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	const message = error instanceof Error ? error.message : "Unexpected server error";
	res.status(500).json({ ok: false, message });
});

app.listen(port, () => {
	console.log(`AI Maps server running at http://localhost:${port}`);
});

