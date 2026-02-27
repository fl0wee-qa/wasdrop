import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { syncDealsJob } from "@/lib/jobs/sync-deals";

function authorizeCron(request: Request) {
  const secret = env().CRON_SECRET;
  if (!secret) {
    return { authorized: false, reason: "CRON_SECRET is not configured on the server." };
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`
    ? { authorized: true }
    : { authorized: false, reason: "Unauthorized. Use Authorization: Bearer <CRON_SECRET>." };
}

export async function POST(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  const result = await syncDealsJob();
  return NextResponse.json(result);
}
