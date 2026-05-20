"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationVariant,
} from "@/stores/notification-store";
import { cn } from "@/lib/utils";

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
        "toast-shell w-[min(100vw-2rem,23rem)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-3 motion-safe:duration-300 motion-reduce:animate-none",
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

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-4 top-4 z-[200] flex w-[min(100vw-2rem,23rem)] flex-col items-stretch gap-3 sm:left-5 sm:top-5"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
}
