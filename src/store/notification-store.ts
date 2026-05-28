import { create } from "zustand";
import { randomId } from "@/lib/random-id";

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
    const id = randomId("toast");
    set((state) => ({ items: [...state.items, { ...item, id }] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((t) => t.id !== id),
    })),
}));
