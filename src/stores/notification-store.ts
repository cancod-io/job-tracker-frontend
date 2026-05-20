import { create } from "zustand";

export type NotificationVariant = "success" | "error" | "warning" | "info";

export type NotificationItem = {
  id: string;
  message: string;
  variant: NotificationVariant;
  title?: string;
};

type NotificationState = {
  items: NotificationItem[];
  push: (item: Omit<NotificationItem, "id">) => string;
  dismiss: (id: string) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  push: (item) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((state) => ({ items: [...state.items, { ...item, id }] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((t) => t.id !== id),
    })),
}));
