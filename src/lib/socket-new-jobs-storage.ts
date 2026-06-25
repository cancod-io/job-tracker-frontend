const KEY_PREFIX = "sjt_socket_new_jobs";

function storageKey(userId: number): string {
  return `${KEY_PREFIX}_${userId}`;
}

/** Read persisted socket-new job ids for a user (survives page reload). */
export function readSocketNewJobIds(userId: number): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    const ids = new Set<string>();
    for (const item of parsed) {
      const id = String(item).trim();
      if (id) ids.add(id);
    }
    return ids;
  } catch {
    return new Set();
  }
}

export function writeSocketNewJobIds(userId: number, jobIds: Iterable<string>): void {
  if (typeof window === "undefined") return;
  try {
    const list = [...new Set([...jobIds].map((id) => id.trim()).filter(Boolean))];
    if (list.length === 0) {
      localStorage.removeItem(storageKey(userId));
      return;
    }
    localStorage.setItem(storageKey(userId), JSON.stringify(list));
  } catch {
    // storage disabled or quota exceeded
  }
}

export function clearSocketNewJobIds(userId: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
