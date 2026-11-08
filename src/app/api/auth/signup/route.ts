import { NextResponse } from "next/server";

import { applySessionCookie } from "@/lib/auth/cookies";
import { signupWithPassword } from "@/lib/auth/signup";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const result = await signupWithPassword(
      body.email ?? "",
      body.password ?? "",
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    const response = NextResponse.json({
      user: { id: result.userId, email: result.email },
    });
    return applySessionCookie(response, result.token, result.expiresAt);
  } catch {
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 },
    );
  }
}
