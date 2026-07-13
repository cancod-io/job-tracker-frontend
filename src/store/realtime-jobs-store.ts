import { create } from "zustand";
import { normalizeAddedJobIds, hasFreshIngestedJobs } from "@/lib/realtime-jobs-ingest";
import type { JobsIngestedPayload } from "@/types/realtime";

type JobSnapshotRow = {
  id: string;
  isNew: boolean;
};

type RealtimeJobsState = {
  activeUserId: number | null;
  /** In-memory highlights from ingest / API `is_new` until the user acknowledges. */
  socketNewJobIds: Set<string>;
  /** In-session ids cleared via open / apply / mark-applied (not persisted). */
  acknowledgedJobIds: Set<string>;
  knownJobIds: Set<string>;
  snapshotInitialized: boolean;
  ingestPending: boolean;
  hydrateForUser: (userId: number) => void;
  handleJobsIngested: (payload: JobsIngestedPayload) => boolean;
  processJobsSnapshot: (jobs: JobSnapshotRow[]) => void;
  /** Mark a job as seen for this session and drop socket highlight. */
  markJobAcknowledged: (jobId: string) => void;
  clearSocketNew: (jobId: string) => void;
  handleJobDeleted: (jobId: number) => void;
  isSocketNew: (jobId: string) => boolean;
  isAcknowledged: (jobId: string) => boolean;
  reset: () => void;
};

const EMPTY_SET = new Set<string>();

const LEGACY_SOCKET_KEY_PREFIX = "sjt_socket_new_jobs";
const LEGACY_DISMISSED_KEY_PREFIX = "sjt_dismissed_new_jobs";

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
  acknowledgedJobIds: new Set<string>(),
  knownJobIds: new Set<string>(),
  snapshotInitialized: false,
  ingestPending: false,

  hydrateForUser(userId) {
    clearLegacyNewBadgeStorage(userId);
    set({
      activeUserId: userId,
      socketNewJobIds: new Set(EMPTY_SET),
      acknowledgedJobIds: new Set(EMPTY_SET),
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
    const { knownJobIds, acknowledgedJobIds } = state;

    for (const id of addedJobIds) {
      if (!knownJobIds.has(id) && !acknowledgedJobIds.has(id)) {
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
    const acknowledgedJobIds = state.acknowledgedJobIds;

    if (!state.snapshotInitialized) {
      const socketNewJobIds = new Set(
        jobs.filter((job) => job.isNew && !acknowledgedJobIds.has(job.id)).map((job) => job.id),
      );
      set({
        snapshotInitialized: true,
        knownJobIds: new Set(jobIds),
        socketNewJobIds,
      });
      return;
    }

    const socketNewJobIds = new Set(state.socketNewJobIds);
    const knownJobIds = new Set(state.knownJobIds);

    // Sync with API `is_new`, but never revive a job the user already acknowledged.
    for (const job of jobs) {
      if (job.isNew && !acknowledgedJobIds.has(job.id)) {
        socketNewJobIds.add(job.id);
      } else {
        socketNewJobIds.delete(job.id);
      }
    }

    if (!state.ingestPending) {
      for (const id of jobIds) knownJobIds.add(id);
      set({ knownJobIds, socketNewJobIds });
      return;
    }

    for (const job of jobs) {
      if (!knownJobIds.has(job.id) && job.isNew && !acknowledgedJobIds.has(job.id)) {
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

  markJobAcknowledged(jobId) {
    const trimmed = jobId.trim();
    if (!trimmed) return;

    const state = get();
    const socketNewJobIds = new Set(state.socketNewJobIds);
    const acknowledgedJobIds = new Set(state.acknowledgedJobIds);
    const knownJobIds = new Set(state.knownJobIds);

    socketNewJobIds.delete(trimmed);
    acknowledgedJobIds.add(trimmed);
    knownJobIds.add(trimmed);

    set({ socketNewJobIds, acknowledgedJobIds, knownJobIds });
  },

  clearSocketNew(jobId) {
    get().markJobAcknowledged(jobId);
  },

  handleJobDeleted(jobId) {
    const id = String(jobId);
    const state = get();
    const socketNewJobIds = new Set(state.socketNewJobIds);
    const acknowledgedJobIds = new Set(state.acknowledgedJobIds);
    const knownJobIds = new Set(state.knownJobIds);
    let changed = false;

    if (socketNewJobIds.delete(id)) changed = true;
    if (acknowledgedJobIds.delete(id)) changed = true;
    if (knownJobIds.delete(id)) changed = true;

    if (!changed) return;

    set({ socketNewJobIds, acknowledgedJobIds, knownJobIds });
  },

  isSocketNew(jobId) {
    return get().socketNewJobIds.has(jobId.trim());
  },

  isAcknowledged(jobId) {
    return get().acknowledgedJobIds.has(jobId.trim());
  },

  reset() {
    const { activeUserId } = get();
    if (activeUserId != null) {
      clearLegacyNewBadgeStorage(activeUserId);
    }
    set({
      activeUserId: null,
      socketNewJobIds: new Set(EMPTY_SET),
      acknowledgedJobIds: new Set(EMPTY_SET),
      knownJobIds: new Set(EMPTY_SET),
      snapshotInitialized: false,
      ingestPending: false,
    });
  },
}));

export function selectSocketNewJobIds(state: RealtimeJobsState): Set<string> {
  return state.socketNewJobIds;
}
