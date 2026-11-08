import { NextResponse } from "next/server";

import { clearSessionCookieOnResponse } from "@/lib/auth/cookies";
import {
  deleteSessionByToken,
  getSessionTokenFromCookies,
} from "@/lib/auth/session";

export async function POST() {
  try {
    const token = await getSessionTokenFromCookies();
    if (token) {
      await deleteSessionByToken(token);
    }
    return clearSessionCookieOnResponse(NextResponse.json({ ok: true }));
  } catch {
    return NextResponse.json(
      { error: "Unable to sign out." },
      { status: 500 },
    );
  }
}
