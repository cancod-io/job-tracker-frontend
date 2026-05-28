/**
 * Returns a URL-safe random identifier. Uses `crypto.randomUUID()` when
 * available and falls back to a timestamp + Math.random() tag otherwise.
 */
export function randomId(prefix = "id"): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
