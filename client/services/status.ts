import { statusNode } from "../dom/elements.js";

export function setStatus(text: string, isError = false): void {
	statusNode.textContent = text;
	statusNode.classList.toggle("error", isError);
}
