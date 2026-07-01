import { create } from "zustand";
import { normalizeAddedJobIds, hasFreshIngestedJobs } from "@/lib/realtime-jobs-ingest";
import {
  clearSocketNewJobIds,
  readSocketNewJobIds,
  writeSocketNewJobIds,
} from "@/lib/socket-new-jobs-storage";
import type { JobsIngestedPayload } from "@/types/realtime";

type RealtimeJobsState = {
  activeUserId: number | null;
  socketNewJobIds: Set<string>;
  knownJobIds: Set<string>;
  snapshotInitialized: boolean;
  ingestPending: boolean;
  hydrateForUser: (userId: number) => void;
  handleJobsIngested: (payload: JobsIngestedPayload) => boolean;
  processJobsSnapshot: (jobIds: string[]) => void;
  clearSocketNew: (jobId: string) => void;
  handleJobDeleted: (jobId: number) => void;
  isSocketNew: (jobId: string) => boolean;
  reset: () => void;
};

const EMPTY_SET = new Set<string>();

function persistSocketNewJobIds(userId: number | null, jobIds: Set<string>): void {
  if (userId == null) return;
  writeSocketNewJobIds(userId, jobIds);
}

export const useRealtimeJobsStore = create<RealtimeJobsState>((set, get) => ({
  activeUserId: null,
  socketNewJobIds: new Set<string>(),
  knownJobIds: new Set<string>(),
  snapshotInitialized: false,
  ingestPending: false,

  hydrateForUser(userId) {
    set({
      activeUserId: userId,
      socketNewJobIds: readSocketNewJobIds(userId),
    });
  },

  handleJobsIngested(payload) {
    if (!hasFreshIngestedJobs(payload)) return false;

    const state = get();
    const addedJobIds = normalizeAddedJobIds(payload);
    const socketNewJobIds = new Set(state.socketNewJobIds);
    const knownJobIds = new Set(state.knownJobIds);

    for (const id of addedJobIds) {
      if (!knownJobIds.has(id)) {
        socketNewJobIds.add(id);
      }
    }

    persistSocketNewJobIds(state.activeUserId, socketNewJobIds);

    set({
      ingestPending: true,
      socketNewJobIds,
    });
    return true;
  },

  processJobsSnapshot(jobIds) {
    const state = get();
    if (!state.snapshotInitialized) {
      set({
        snapshotInitialized: true,
        knownJobIds: new Set(jobIds),
      });
      return;
    }

    if (!state.ingestPending) {
      const knownJobIds = new Set(state.knownJobIds);
      for (const id of jobIds) knownJobIds.add(id);
      set({ knownJobIds });
      return;
    }

    const socketNewJobIds = new Set(state.socketNewJobIds);
    const knownJobIds = new Set(state.knownJobIds);

    for (const id of jobIds) {
      if (!knownJobIds.has(id)) {
        socketNewJobIds.add(id);
      }
      knownJobIds.add(id);
    }

    persistSocketNewJobIds(state.activeUserId, socketNewJobIds);

    set({
      socketNewJobIds,
      knownJobIds,
      ingestPending: false,
    });
  },

  clearSocketNew(jobId) {
    const trimmed = jobId.trim();
    if (!trimmed) return;
    const state = get();
    if (!state.socketNewJobIds.has(trimmed)) return;
    const socketNewJobIds = new Set(state.socketNewJobIds);
    socketNewJobIds.delete(trimmed);
    persistSocketNewJobIds(state.activeUserId, socketNewJobIds);
    set({ socketNewJobIds });
  },

  handleJobDeleted(jobId) {
    const id = String(jobId);
    const state = get();
    const socketNewJobIds = new Set(state.socketNewJobIds);
    const knownJobIds = new Set(state.knownJobIds);
    let changed = false;

    if (socketNewJobIds.delete(id)) changed = true;
    if (knownJobIds.delete(id)) changed = true;

    if (!changed) return;

    persistSocketNewJobIds(state.activeUserId, socketNewJobIds);
    set({ socketNewJobIds, knownJobIds });
  },

  isSocketNew(jobId) {
    return get().socketNewJobIds.has(jobId.trim());
  },

  reset() {
    const { activeUserId } = get();
    if (activeUserId != null) {
      clearSocketNewJobIds(activeUserId);
    }
    set({
      activeUserId: null,
      socketNewJobIds: new Set(EMPTY_SET),
      knownJobIds: new Set(EMPTY_SET),
      snapshotInitialized: false,
      ingestPending: false,
    });
  },
}));

export function selectSocketNewJobIds(state: RealtimeJobsState): Set<string> {
  return state.socketNewJobIds;
}
