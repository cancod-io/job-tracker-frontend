import { create } from "zustand";
import {
  createApplication,
  deleteApplication,
  fetchApplicationsList,
  updateApplication,
} from "@/lib/applications-api";
import { randomId } from "@/lib/random-id";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

export type PendingApplyJob = {
  id: string;
  jobId: number;
  jobTitle: string;
  company: string;
  applyUrl: string;
};

export type PendingApplyJobInput = Omit<PendingApplyJob, "id">;

/* ─── Decode helpers ─────────────────────────────────────────────────────── */
// Status is now updated via the API's `status` field directly.
// We still decode legacy records that stored status as JSON inside notes.

function normalizeStatus(s: string): ApiApplicationStatus {
  if (s === "new") return "applied";
  if (s === "rejected") return "failed";
  if (s === "applied" || s === "interviewing" || s === "offer" || s === "failed") {
    return s as ApiApplicationStatus;
  }
  return "applied";
}

function decodeApplication(a: ApiApplication): ApiApplication {
  if (!a.notes) return { ...a, status: normalizeStatus(a.status) };
  try {
    const p = JSON.parse(a.notes) as { s?: string; n?: string };
    if (p.s && p.n !== undefined) {
      return { ...a, status: normalizeStatus(p.s), notes: p.n };
    }
  } catch {
    // plain text notes — leave as-is
  }
  return { ...a, status: normalizeStatus(a.status) };
}

/* ─── Store ──────────────────────────────────────────────────────────────── */

type ApplicationsState = {
  applications: ApiApplication[];
  loading: boolean;
  error: string | null;
  pendingApplyJobs: PendingApplyJob[];
};

type ApplicationsActions = {
  fetchApplications: () => Promise<void>;
  createApp: (jobId: number, notes?: string, status?: ApiApplicationStatus) => Promise<ApiApplication>;
  /** PATCH { status, notes } — persists column changes via API. */
  updateStatus: (applicationId: number, newStatus: ApiApplicationStatus) => Promise<void>;
  /** PATCH { notes, status } — preserves the current status. */
  updateNotes: (applicationId: number, notes: string) => Promise<void>;
  removeApplication: (applicationId: number) => Promise<void>;
  addPendingApplyJob: (job: PendingApplyJobInput) => void;
  removePendingApplyJob: (id: string) => void;
};

export const useApplicationsStore = create<ApplicationsState & ApplicationsActions>((set, get) => ({
  applications: [],
  loading: false,
  error: null,
  pendingApplyJobs: [],

  fetchApplications: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchApplicationsList({ limit: 100 });
      set({ applications: data.items.map(decodeApplication), loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load applications",
        loading: false,
      });
    }
  },

  createApp: async (jobId, notes = "", status = "applied") => {
    const created = await createApplication({ job_id: jobId, notes, status });
    const app = decodeApplication(created);
    set((s) => ({ applications: [app, ...s.applications] }));
    return app;
  },

  updateStatus: async (applicationId, newStatus) => {
    const existing = get().applications.find((a) => a.id === applicationId);
    const plainNotes = existing?.notes ?? "";

    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === applicationId ? { ...a, status: newStatus } : a,
      ),
    }));

    try {
      const updated = await updateApplication(applicationId, {
        status: newStatus,
        notes: plainNotes,
      });
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === applicationId ? decodeApplication(updated) : a,
        ),
      }));
    } catch (e) {
      await get().fetchApplications();
      throw e;
    }
  },

  updateNotes: async (applicationId, notes) => {
    const existing = get().applications.find((a) => a.id === applicationId);
    const currentStatus = existing?.status ?? "applied";

    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === applicationId ? { ...a, notes } : a,
      ),
    }));

    try {
      const updated = await updateApplication(applicationId, {
        notes,
        status: currentStatus,
      });
      const decoded = decodeApplication(updated);
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === applicationId ? { ...decoded, notes } : a,
        ),
      }));
    } catch (e) {
      await get().fetchApplications();
      throw e;
    }
  },

  removeApplication: async (applicationId) => {
    set((s) => ({
      applications: s.applications.filter((a) => a.id !== applicationId),
    }));
    try {
      await deleteApplication(applicationId);
    } catch (e) {
      await get().fetchApplications();
      throw e;
    }
  },

  addPendingApplyJob: (job) =>
    set((s) => ({
      pendingApplyJobs: [
        ...s.pendingApplyJobs,
        { ...job, id: randomId("pending") },
      ],
    })),

  removePendingApplyJob: (id) =>
    set((s) => ({
      pendingApplyJobs: s.pendingApplyJobs.filter((p) => p.id !== id),
    })),
}));
