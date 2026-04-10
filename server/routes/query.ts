import type express from "express";
import { generateResponse } from "../openai/openai.js";

export function registerQueryRoute(app: express.Express): void {
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
}
