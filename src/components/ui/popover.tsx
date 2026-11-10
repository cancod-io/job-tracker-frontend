"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Align = "start" | "end";

export type PopoverRenderProps = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

type PopoverProps = {
  /** Inline trigger. Receives open state + toggle/close helpers. */
  button: (props: PopoverRenderProps) => ReactNode;
  /** Panel content, portaled to <body> and positioned under the trigger. */
  children: (props: PopoverRenderProps) => ReactNode;
  /** Preferred horizontal alignment of the panel relative to the trigger. */
  align?: Align;
  /** Vertical gap between trigger and panel, in pixels. */
  gap?: number;
  panelClassName?: string;
};

const VIEWPORT_MARGIN = 8;

/**
 * Floating popover anchored to an inline trigger.
 *
 * The panel renders in a portal with `position: fixed`, so it escapes
 * `overflow` clipping (e.g. the horizontally-scrolling Kanban board) and any
 * ancestor stacking context. After mount the panel is measured and clamped to
 * the viewport — shifting horizontally and flipping above the trigger when it
 * would otherwise overflow. Closes on outside click, Escape, and repositions
 * on scroll/resize.
 */
export function Popover({
  button,
  children,
  align = "end",
  gap = 8,
  panelClassName,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const r = trigger.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;

    // Horizontal: anchor per `align`, then clamp inside the viewport.
    let left = align === "end" ? r.right - pw : r.left;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - pw - VIEWPORT_MARGIN));

    // Vertical: below the trigger; flip above if it would overflow the bottom.
    let top = r.bottom + gap;
    if (top + ph > window.innerHeight - VIEWPORT_MARGIN) {
      const above = r.top - gap - ph;
      top =
        above >= VIEWPORT_MARGIN
          ? above
          : Math.max(VIEWPORT_MARGIN, window.innerHeight - ph - VIEWPORT_MARGIN);
    }

    setCoords({ top, left });
  }, [align, gap]);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    reposition();

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition]);

  const rp: PopoverRenderProps = { open, toggle, close };

  return (
    <div ref={triggerRef} className="relative inline-flex">
      {button(rp)}
      {open
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                top: coords?.top ?? 0,
                left: coords?.left ?? 0,
                // Hidden for the first frame until measured, to avoid a flash at (0,0).
                visibility: coords ? "visible" : "hidden",
              }}
              className={cn("z-[300]", panelClassName)}
            >
              {children(rp)}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
