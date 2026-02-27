import { NextResponse } from "next/server";
import { z } from "zod";

import { runAdminAssistant } from "@/lib/ai/admin-assistant";
import { getAuthSession } from "@/lib/auth";
import { isAdminAiEnabled } from "@/lib/env";
import { consumeRateLimit, getClientIp } from "@/lib/ip-rate-limit";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(3000),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminAiEnabled()) {
    return NextResponse.json({ error: "Admin AI is disabled. Set ADMIN_AI_ENABLED=true." }, { status: 503 });
  }

  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit({
    bucket: "ai.admin.chat",
    key: `${session.user.id}:${ip}`,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const response = await runAdminAssistant(parsed.data.messages);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin AI request failed." },
      { status: 500 },
    );
  }
}
