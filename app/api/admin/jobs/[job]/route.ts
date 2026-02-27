import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { syncDealsJob } from "@/lib/jobs/sync-deals";
import { syncNewsJob } from "@/lib/jobs/sync-news";

const bodySchema = z.object({
  countries: z.array(z.string().length(2)).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ job: string }> }) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { job } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (job === "deals") {
    const result = await syncDealsJob(parsed.data.countries);
    return NextResponse.json(result);
  }

  if (job === "news") {
    const result = await syncNewsJob();
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown job" }, { status: 404 });
}
