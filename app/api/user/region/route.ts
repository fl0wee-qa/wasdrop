import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { COUNTRY_COOKIE_KEY, persistCountryPreference } from "@/lib/services/user-preferences";

const schema = z.object({
  country: z.string().length(2),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await getAuthSession();
  const country = await persistCountryPreference(parsed.data.country, session?.user?.id);

  const cookieStore = await cookies();
  cookieStore.set(COUNTRY_COOKIE_KEY, country, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return NextResponse.json({ country });
}
