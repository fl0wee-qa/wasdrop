import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { suggestCountryFromIp } from "@/lib/geolocation";

export async function GET() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? null;
  const country = await suggestCountryFromIp(ip);

  return NextResponse.json({ country });
}
