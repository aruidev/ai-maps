import express from "express";
import { setupApp } from "./config/app.js";
import { loadEnvironment } from "./config/environment.js";
import { getRuntimeConfig } from "./config/runtime.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { registerRoutes } from "./routes/index.js";

loadEnvironment();
const { mapboxAccessToken, port } = getRuntimeConfig();

const app = express();
setupApp(app);
registerRoutes(app, mapboxAccessToken);
app.use(errorHandler);

app.listen(port, () => {
	console.log(`AI Maps server running at http://localhost:${port}`);
});

