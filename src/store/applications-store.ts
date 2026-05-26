import { create } from "zustand";
import {
  createApplication,
  deleteApplication,
  fetchApplicationsList,
  updateApplication,
} from "@/lib/applications-api";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

export type PendingApplyJob = {
  jobId: number;
  jobTitle: string;
  company: string;
  applyUrl: string;
};

/* ─── Notes encoding ─────────────────────────────────────────────────────── */
// The backend PATCH only accepts { notes }. We encode status inside notes as
// JSON: { s: ApiApplicationStatus, n: string }. On read we decode it back.
// Plain-text notes (no JSON) fall back gracefully — status comes from the API.

type EncodedNote = { s: ApiApplicationStatus; n: string };

function encodeNotes(status: ApiApplicationStatus, notes: string): string {
  return JSON.stringify({ s: status, n: notes } satisfies EncodedNote);
}

function decodeNotes(raw: string | null | undefined): {
  status: ApiApplicationStatus | null;
  notes: string;
} {
  if (!raw) return { status: null, notes: "" };
  try {
    const parsed = JSON.parse(raw) as EncodedNote;
    if (parsed.s && parsed.n !== undefined) {
      return { status: parsed.s, notes: parsed.n };
    }
  } catch {
    // not our JSON — treat as plain notes text
  }
  return { status: null, notes: raw };
}

function decodeApplications(apps: ApiApplication[]): ApiApplication[] {
  return apps.map((a) => {
    const { status, notes } = decodeNotes(a.notes);
    return { ...a, status: status ?? a.status, notes };
  });
}

/* ─── Store ──────────────────────────────────────────────────────────────── */

type ApplicationsState = {
  applications: ApiApplication[];
  loading: boolean;
  error: string | null;
  pendingApplyJob: PendingApplyJob | null;
};

type ApplicationsActions = {
  fetchApplications: () => Promise<void>;
  createApp: (jobId: number, notes?: string, status?: ApiApplicationStatus) => Promise<ApiApplication>;
  /** PATCH with encoded notes — persists status via API, no localStorage. */
  updateStatus: (applicationId: number, newStatus: ApiApplicationStatus) => Promise<void>;
  /** PATCH with encoded notes — preserves the current status. */
  updateNotes: (applicationId: number, notes: string) => Promise<void>;
  removeApplication: (applicationId: number) => Promise<void>;
  setPendingApplyJob: (job: PendingApplyJob | null) => void;
};

export const useApplicationsStore = create<ApplicationsState & ApplicationsActions>((set, get) => ({
  applications: [],
  loading: false,
  error: null,
  pendingApplyJob: null,

  fetchApplications: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchApplicationsList({ limit: 100 });
      set({ applications: decodeApplications(data.items), loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load applications",
        loading: false,
      });
    }
  },

  createApp: async (jobId, notes = "", status = "new") => {
    const created = await createApplication({
      job_id: jobId,
      notes: encodeNotes(status, notes),
    });
    const decoded = decodeNotes(created.notes);
    const app: ApiApplication = {
      ...created,
      status: decoded.status ?? status,
      notes: decoded.notes,
    };
    set((s) => ({ applications: [app, ...s.applications] }));
    return app;
  },

  updateStatus: async (applicationId, newStatus) => {
    const existing = get().applications.find((a) => a.id === applicationId);
    const existingNotes = existing?.notes ?? "";

    // Optimistic update.
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === applicationId ? { ...a, status: newStatus } : a,
      ),
    }));

    try {
      const updated = await updateApplication(applicationId, {
        notes: encodeNotes(newStatus, existingNotes),
      });
      const decoded = decodeNotes(updated.notes);
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === applicationId
            ? { ...a, status: decoded.status ?? newStatus, notes: decoded.notes }
            : a,
        ),
      }));
    } catch (e) {
      await get().fetchApplications();
      throw e;
    }
  },

  updateNotes: async (applicationId, notes) => {
    const existing = get().applications.find((a) => a.id === applicationId);
    const currentStatus = existing?.status ?? "new";

    // Optimistic update.
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === applicationId ? { ...a, notes } : a,
      ),
    }));

    try {
      const updated = await updateApplication(applicationId, {
        notes: encodeNotes(currentStatus, notes),
      });
      const decoded = decodeNotes(updated.notes);
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === applicationId
            ? { ...a, status: decoded.status ?? currentStatus, notes: decoded.notes }
            : a,
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

  setPendingApplyJob: (job) => set({ pendingApplyJob: job }),
}));
