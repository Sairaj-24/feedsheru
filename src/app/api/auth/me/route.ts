import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load session." },
      { status: 500 },
    );
  }
}
