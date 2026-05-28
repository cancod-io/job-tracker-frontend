"use client";

import { useCallback, useState } from "react";
import { notify } from "@/lib/notify";
import { COLUMNS } from "@/components/applications/constants";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

type UseKanbanDndOptions = {
  updateStatus: (applicationId: number, newStatus: ApiApplicationStatus) => Promise<void>;
};

type UseKanbanDndReturn = {
  draggingId: number | null;
  draggingSourceColumn: ApiApplicationStatus | null;
  dragOverColumn: ApiApplicationStatus | null;
  handleDragStart: (e: React.DragEvent, app: ApiApplication) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, colId: ApiApplicationStatus) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, colId: ApiApplicationStatus) => Promise<void>;
};

/**
 * Encapsulates all HTML5 drag-and-drop state and handlers for the Kanban board.
 * Drops call `updateStatus` and show toast notifications on success/failure.
 */
export function useKanbanDnd({ updateStatus }: UseKanbanDndOptions): UseKanbanDndReturn {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingSourceColumn, setDraggingSourceColumn] = useState<ApiApplicationStatus | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApiApplicationStatus | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, app: ApiApplication) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ id: app.id, status: app.status }),
    );
    setDraggingId(app.id);
    setDraggingSourceColumn(app.status);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDraggingSourceColumn(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, colId: ApiApplicationStatus) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverColumn((prev) => (prev !== colId ? colId : prev));
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, colId: ApiApplicationStatus) => {
      e.preventDefault();
      setDragOverColumn(null);
      setDraggingId(null);
      setDraggingSourceColumn(null);

      let payload: { id: number; status: ApiApplicationStatus } | null = null;
      try {
        payload = JSON.parse(
          e.dataTransfer.getData("application/json"),
        ) as { id: number; status: ApiApplicationStatus };
      } catch {
        return;
      }

      if (!payload || payload.status === colId) return;

      try {
        await updateStatus(payload.id, colId);
        const col = COLUMNS.find((c) => c.id === colId);
        notify.success(`Moved to ${col?.label ?? colId}`);
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Failed to update status.");
      }
    },
    [updateStatus],
  );

  return {
    draggingId,
    draggingSourceColumn,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
