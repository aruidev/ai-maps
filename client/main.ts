import { setupEventListeners } from "./events/listeners.js";
import { initializeMap } from "./services/map.js";
import { restoreMarkers } from "./services/markers.js";
import { setStatus } from "./services/status.js";
import { initializeTheme } from "./services/theme.js";

initializeTheme();
setupEventListeners();

void initializeMap(() => {
  restoreMarkers();
  setStatus("Map ready. Enter a geographic query.");
}).catch(() => {
  setStatus("Error initializing the map.", true);
});
