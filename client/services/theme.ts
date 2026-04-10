import { THEME_STORAGE_KEY } from "../constants.js";
import { themeToggleButton } from "../dom/elements.js";

export function setTheme(theme: "light" | "dark"): void {
  document.body.dataset.theme = theme;
  document.body.classList.toggle("light-theme", theme === "light");
  document.body.classList.toggle("dark-theme", theme === "dark");
  themeToggleButton.textContent =
    theme === "light" ? "🌙 Dark theme" : "☀️ Light theme";
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme(): void {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const initialTheme = storedTheme === "dark" ? "dark" : "light";
  setTheme(initialTheme);
}
