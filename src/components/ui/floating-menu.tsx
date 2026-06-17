"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const VIEWPORT_MARGIN = 8;

type FloatingMenuPortalProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
  gap?: number;
};

/**
 * Renders a menu in a body portal with `position: fixed` so it stays above
 * stacked cards, sticky headers, and overflow clipping.
 */
export function FloatingMenuPortal({
  open,
  anchorRef,
  onClose,
  children,
  className,
  align = "end",
  gap = 8,
}: FloatingMenuPortalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const r = anchor.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;

    let left = align === "end" ? r.right - pw : r.left;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - pw - VIEWPORT_MARGIN));

    let top = r.bottom + gap;
    if (top + ph > window.innerHeight - VIEWPORT_MARGIN) {
      const above = r.top - gap - ph;
      top = above >= VIEWPORT_MARGIN ? above : Math.max(VIEWPORT_MARGIN, window.innerHeight - ph - VIEWPORT_MARGIN);
    }

    setCoords({ top, left });
  }, [align, anchorRef, gap]);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    reposition();
    const frame = window.requestAnimationFrame(() => reposition());

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, onClose, reposition, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        visibility: coords ? "visible" : "hidden",
      }}
      className={cn("z-[400]", className)}
    >
      {children}
    </div>,
    document.body,
  );
}
