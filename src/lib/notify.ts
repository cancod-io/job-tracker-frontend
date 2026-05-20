import { useNotificationStore, type NotificationVariant } from "@/stores/notification-store";

const DEFAULT_DURATION_MS = 5_500;
const ERROR_DURATION_MS = 7_000;

type NotifyOptions = {
  title?: string;
  duration?: number;
};

function scheduleDismiss(id: string, duration: number) {
  if (duration <= 0) return;
  window.setTimeout(() => {
    useNotificationStore.getState().dismiss(id);
  }, duration);
}

function show(variant: NotificationVariant, message: string, options: NotifyOptions = {}) {
  const duration =
    options.duration ?? (variant === "error" ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);
  const id = useNotificationStore.getState().push({
    message,
    variant,
    title: options.title,
  });
  scheduleDismiss(id, duration);
  return id;
}

/** Platform-wide toast notifications. Use for API failures, form errors, and action feedback. */
export const notify = {
  success: (message: string, options?: NotifyOptions) => show("success", message, options),
  error: (message: string, options?: NotifyOptions) => show("error", message, options),
  warning: (message: string, options?: NotifyOptions) => show("warning", message, options),
  info: (message: string, options?: NotifyOptions) => show("info", message, options),
};
