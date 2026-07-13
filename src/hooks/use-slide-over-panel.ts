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
 * List identity churn (cache updates, re-sort) must not cancel the open
 * animation for an unchanged `selectedId` — that previously left the panel
 * stuck in `entering` (off-screen).
 */
export function useSlideOverPanel<T extends Identifiable>(
  items: T[],
  transitionMs: number,
): UseSlideOverPanelReturn<T> {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [item, setItem] = useState<T | null>(null);
  const [phase, setPhase] = useState<SlideOverPhase>("closed");

  const phaseRef = useRef<SlideOverPhase>("closed");
  const selectedIdRef = useRef<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterRaf1Ref = useRef<number | null>(null);
  const enterRaf2Ref = useRef<number | null>(null);
  phaseRef.current = phase;
  selectedIdRef.current = selectedId;

  const clearEnterRaf = useCallback(() => {
    if (enterRaf1Ref.current != null) {
      cancelAnimationFrame(enterRaf1Ref.current);
      enterRaf1Ref.current = null;
    }
    if (enterRaf2Ref.current != null) {
      cancelAnimationFrame(enterRaf2Ref.current);
      enterRaf2Ref.current = null;
    }
  }, []);

  const close = useCallback(() => {
    if (phaseRef.current === "closed" || phaseRef.current === "leaving") return;
    clearEnterRaf();
    setPhase("leaving");
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setSelectedId(null);
      setItem(null);
      setPhase("closed");
    }, transitionMs);
  }, [clearEnterRaf, transitionMs]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      clearEnterRaf();
    },
    [clearEnterRaf],
  );

  // Resolve the selected row from the latest list without touching open/close phase.
  useEffect(() => {
    if (selectedId === null) {
      setItem(null);
      return;
    }
    const next = items.find((x) => x.id === selectedId);
    if (!next) {
      clearEnterRaf();
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setSelectedId(null);
      setItem(null);
      setPhase("closed");
      return;
    }
    setItem(next);
  }, [selectedId, items, clearEnterRaf]);

  // Open/close animation — depends only on selectedId.
  useEffect(() => {
    if (selectedId === null) {
      clearEnterRaf();
      if (phaseRef.current !== "leaving") {
        setPhase("closed");
      }
      return;
    }

    // Already visible / animating in for this id.
    if (phaseRef.current === "open" || phaseRef.current === "entering") {
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setPhase("entering");
    clearEnterRaf();
    enterRaf1Ref.current = requestAnimationFrame(() => {
      enterRaf1Ref.current = null;
      enterRaf2Ref.current = requestAnimationFrame(() => {
        enterRaf2Ref.current = null;
        // Only finish open if this selection is still active.
        if (selectedIdRef.current === selectedId) {
          setPhase("open");
        }
      });
    });
  }, [selectedId, clearEnterRaf]);

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

  const open = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSelectedId(trimmed);
  }, []);

  return { selectedId, phase, item, open, close };
}
