import { create } from "zustand";
import { normalizeAddedJobIds, hasFreshIngestedJobs } from "@/lib/realtime-jobs-ingest";
import type { JobsIngestedPayload } from "@/types/realtime";

type JobSnapshotRow = {
  id: string;
  isNew: boolean;
};

type RealtimeJobsState = {
  activeUserId: number | null;
  /** In-memory only — session highlights from `jobs.ingested` until acknowledge / API says not new. */
  socketNewJobIds: Set<string>;
  knownJobIds: Set<string>;
  snapshotInitialized: boolean;
  ingestPending: boolean;
  hydrateForUser: (userId: number) => void;
  handleJobsIngested: (payload: JobsIngestedPayload) => boolean;
  processJobsSnapshot: (jobs: JobSnapshotRow[]) => void;
  clearSocketNew: (jobId: string) => void;
  handleJobDeleted: (jobId: number) => void;
  isSocketNew: (jobId: string) => boolean;
  reset: () => void;
};

const EMPTY_SET = new Set<string>();

const LEGACY_SOCKET_KEY_PREFIX = "sjt_socket_new_jobs";
const LEGACY_DISMISSED_KEY_PREFIX = "sjt_dismissed_new_jobs";

/** Drop old localStorage badge state — `is_new` + acknowledge is the source of truth. */
function clearLegacyNewBadgeStorage(userId: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${LEGACY_SOCKET_KEY_PREFIX}_${userId}`);
    localStorage.removeItem(`${LEGACY_DISMISSED_KEY_PREFIX}_${userId}`);
  } catch {
    // ignore
  }
}

export const useRealtimeJobsStore = create<RealtimeJobsState>((set, get) => ({
  activeUserId: null,
  socketNewJobIds: new Set<string>(),
  knownJobIds: new Set<string>(),
  snapshotInitialized: false,
  ingestPending: false,

  hydrateForUser(userId) {
    clearLegacyNewBadgeStorage(userId);
    set({
      activeUserId: userId,
      // Do not restore unread ids from disk — API `is_new` owns persistence.
      socketNewJobIds: new Set(EMPTY_SET),
      knownJobIds: new Set(EMPTY_SET),
      snapshotInitialized: false,
      ingestPending: false,
    });
  },

  handleJobsIngested(payload) {
    if (!hasFreshIngestedJobs(payload)) return false;

    const state = get();
    const addedJobIds = normalizeAddedJobIds(payload);
    const socketNewJobIds = new Set(state.socketNewJobIds);
    const knownJobIds = state.knownJobIds;

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

  processJobsSnapshot(jobs) {
    const state = get();
    const jobIds = jobs.map((job) => job.id);

    if (!state.snapshotInitialized) {
      // Seed session highlights from API `is_new` so badges/nav match the server.
      const socketNewJobIds = new Set(jobs.filter((job) => job.isNew).map((job) => job.id));
      set({
        snapshotInitialized: true,
        knownJobIds: new Set(jobIds),
        socketNewJobIds,
      });
      return;
    }

    const socketNewJobIds = new Set(state.socketNewJobIds);
    const knownJobIds = new Set(state.knownJobIds);

    // Keep highlights aligned with API `is_new` (acknowledge → false clears badge).
    for (const job of jobs) {
      if (job.isNew) socketNewJobIds.add(job.id);
      else socketNewJobIds.delete(job.id);
    }

    if (!state.ingestPending) {
      for (const id of jobIds) knownJobIds.add(id);
      set({ knownJobIds, socketNewJobIds });
      return;
    }

    for (const job of jobs) {
      if (!knownJobIds.has(job.id) && job.isNew) {
        socketNewJobIds.add(job.id);
      }
      knownJobIds.add(job.id);
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
    if (!state.socketNewJobIds.has(trimmed)) {
      // Still mark known so a pending ingest snapshot won't re-add it.
      if (!state.knownJobIds.has(trimmed)) {
        const knownJobIds = new Set(state.knownJobIds);
        knownJobIds.add(trimmed);
        set({ knownJobIds });
      }
      return;
    }

    const socketNewJobIds = new Set(state.socketNewJobIds);
    const knownJobIds = new Set(state.knownJobIds);
    socketNewJobIds.delete(trimmed);
    knownJobIds.add(trimmed);
    set({ socketNewJobIds, knownJobIds });
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

    set({ socketNewJobIds, knownJobIds });
  },

  isSocketNew(jobId) {
    return get().socketNewJobIds.has(jobId.trim());
  },

  reset() {
    const { activeUserId } = get();
    if (activeUserId != null) {
      clearLegacyNewBadgeStorage(activeUserId);
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
