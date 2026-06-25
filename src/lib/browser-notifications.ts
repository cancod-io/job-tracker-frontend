/** Request browser notification permission when supported. */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

type PushJobIngestOptions = {
  title?: string;
  body: string;
  jobIds?: string[];
  onClick?: () => void;
};

function notificationTag(jobIds: string[]): string {
  if (jobIds.length === 0) return "trackcod-jobs-ingested";
  const suffix = jobIds.slice(0, 5).join("-");
  return `trackcod-jobs-ingested-${suffix}`;
}

/** Show a native push notification when permission is granted. */
export function showJobIngestNotification({
  title = "New jobs available",
  body,
  jobIds = [],
  onClick,
}: PushJobIngestOptions): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  try {
    const notification = new Notification(title, {
      body,
      tag: notificationTag(jobIds),
      icon: "/favicon.ico",
    });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch {
    /* ignore — notifications are best-effort */
  }
}
