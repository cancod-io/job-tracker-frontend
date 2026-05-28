import { useEffect, type RefObject } from "react";

/**
 * Fires `handler` whenever a `mousedown` event occurs outside `ref`.
 *
 * @param ref     - ref attached to the element to watch
 * @param handler - callback to fire on outside click
 * @param enabled - set to `false` to temporarily disable without resetting the hook
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, handler, enabled]);
}
