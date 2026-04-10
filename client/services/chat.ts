import { chatLog } from "../dom/elements.js";

export function appendChatEntry(
  role: "user" | "assistant",
  text: string,
): void {
  const item = document.createElement("li");
  item.className = `chat-entry ${role}`;
  item.textContent = text;
  chatLog.prepend(item);
}
