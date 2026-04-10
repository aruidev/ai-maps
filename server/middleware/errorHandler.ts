import type express from "express";

export function errorHandler(
	error: unknown,
	_req: express.Request,
	res: express.Response,
	_next: express.NextFunction
): void {
	const message = error instanceof Error ? error.message : "Unexpected server error";
	res.status(500).json({ ok: false, message });
}
