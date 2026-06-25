import { create } from "zustand";
import { normalizeAddedJobIds, hasFreshIngestedJobs } from "@/lib/realtime-jobs-ingest";
import type { JobsIngestedPayload } from "@/types/realtime";

type RealtimeJobsState = {
  socketNewJobIds: Set<string>;
  knownJobIds: Set<string>;
  snapshotInitialized: boolean;
  ingestPending: boolean;
  handleJobsIngested: (payload: JobsIngestedPayload) => boolean;
  processJobsSnapshot: (jobIds: string[]) => void;
  clearSocketNew: (jobId: string) => void;
  isSocketNew: (jobId: string) => boolean;
  reset: () => void;
};

const EMPTY_SET = new Set<string>();

export const useRealtimeJobsStore = create<RealtimeJobsState>((set, get) => ({
  socketNewJobIds: new Set<string>(),
  knownJobIds: new Set<string>(),
  snapshotInitialized: false,
  ingestPending: false,

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
    set({ socketNewJobIds });
  },

  isSocketNew(jobId) {
    return get().socketNewJobIds.has(jobId.trim());
  },

  reset() {
    set({
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
