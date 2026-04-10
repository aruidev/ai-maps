function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required DOM element: ${selector}`);
  }
  return element;
}

export const queryForm = requireElement<HTMLFormElement>("#query-form");
export const systemInfoInput =
  requireElement<HTMLTextAreaElement>("#system-info");
export const messageInput = requireElement<HTMLInputElement>("#message");
export const placeMarkerButton =
  requireElement<HTMLButtonElement>("#place-marker");
export const themeToggleButton =
  requireElement<HTMLButtonElement>("#theme-toggle");
export const statusNode = requireElement<HTMLElement>("#status");
export const markerList = requireElement<HTMLUListElement>("#marker-list");
export const chatLog = requireElement<HTMLUListElement>("#chat-log");
