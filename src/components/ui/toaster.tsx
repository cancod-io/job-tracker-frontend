"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationVariant,
} from "@/store/notification-store";
import { cn } from "@/lib/utils";

const TOAST_Z_INDEX = 9999;

const variantIcons: Record<NotificationVariant, typeof AlertCircle> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastCard({ item, onDismiss }: { item: NotificationItem; onDismiss: () => void }) {
  const Icon = variantIcons[item.variant];

  return (
    <div
      data-variant={item.variant}
      role={item.variant === "error" ? "alert" : "status"}
      aria-live={item.variant === "error" ? "assertive" : "polite"}
      className={cn(
        "toast-shell pointer-events-auto w-[min(100vw-2rem,23rem)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300 motion-reduce:animate-none",
      )}
    >
      <div className="toast-icon">
        <Icon className="size-[1.125rem]" strokeWidth={2.25} aria-hidden />
      </div>
      <div className="toast-body">
        {item.title ? <p className="toast-title">{item.title}</p> : null}
        <p className={cn("toast-message", !item.title && "toast-message--primary")}>
          {item.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="toast-dismiss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--toast-surface))]"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

export function Toaster() {
  const items = useNotificationStore((s) => s.items);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-center gap-3 px-4 pt-4 sm:px-5 sm:pt-5"
      style={{ zIndex: TOAST_Z_INDEX }}
      aria-label="Notifications"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>,
    document.body,
  );
}
