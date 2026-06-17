import { type NextRequest, NextResponse } from "next/server";
import {
  formatSessionRemaining,
  type SessionTimeoutSnapshot,
} from "@/lib/session-timeout-dev-logger";

/** Dev-only endpoint — prints session countdown to the `npm run dev` terminal. */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let snapshot: SessionTimeoutSnapshot;
  try {
    snapshot = (await req.json()) as SessionTimeoutSnapshot;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ts = new Date().toISOString().slice(11, 19);

  if (!snapshot.signedIn) {
    console.log(`[${ts}] [session] signed out`);
    return NextResponse.json({ ok: true });
  }

  console.log(
    `[${ts}] [session] access expires in ${formatSessionRemaining(snapshot.accessRemainingMs)}` +
      ` | refresh expires in ${formatSessionRemaining(snapshot.refreshRemainingMs)}` +
      ` | auto-refresh in ${formatSessionRemaining(snapshot.proactiveRefreshInMs)}`,
  );

  return NextResponse.json({ ok: true });
}
