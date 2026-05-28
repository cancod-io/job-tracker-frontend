"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SlideOverPhase = "closed" | "entering" | "open" | "leaving";

type Identifiable = { id: string };

type UseSlideOverPanelReturn<T extends Identifiable> = {
  selectedId: string | null;
  phase: SlideOverPhase;
  item: T | null;
  open: (id: string) => void;
  close: () => void;
};

/**
 * Drives a slide-over / drawer panel:
 *
 * - Owns `selectedId` and resolves the matching item from `items`.
 * - Runs a 4-phase enter/leave animation gated on `transitionMs`.
 * - Locks body scroll and wires up Escape-to-close while open.
 *
 * Items are looked up by `id` each render; if the currently-selected item
 * disappears from the list, the panel auto-closes.
 */
export function useSlideOverPanel<T extends Identifiable>(
  items: T[],
  transitionMs: number,
): UseSlideOverPanelReturn<T> {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [item, setItem] = useState<T | null>(null);
  const [phase, setPhase] = useState<SlideOverPhase>("closed");

  const prevSelectedRef = useRef<string | null>(null);
  const phaseRef = useRef<SlideOverPhase>("closed");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  phaseRef.current = phase;

  const close = useCallback(() => {
    if (phaseRef.current === "closed" || phaseRef.current === "leaving") return;
    setPhase("leaving");
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setSelectedId(null);
      setItem(null);
      setPhase("closed");
      prevSelectedRef.current = null;
    }, transitionMs);
  }, [transitionMs]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (selectedId === null) {
      setItem(null);
      setPhase("closed");
      prevSelectedRef.current = null;
      return;
    }
    const next = items.find((x) => x.id === selectedId);
    if (!next) {
      setSelectedId(null);
      return;
    }
    setItem(next);

    const prev = prevSelectedRef.current;
    if (prev === selectedId) return;
    prevSelectedRef.current = selectedId;

    if (prev === null) {
      setPhase("entering");
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase("open")),
      );
      return () => cancelAnimationFrame(raf);
    }
    setPhase("open");
  }, [selectedId, items]);

  useEffect(() => {
    if (!item) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [item, close]);

  const open = useCallback((id: string) => setSelectedId(id), []);

  return { selectedId, phase, item, open, close };
}
