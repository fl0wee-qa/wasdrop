import { NextResponse } from "next/server";
import { z } from "zod";

import { adminProposalSchema } from "@/lib/ai/admin-assistant";
import { applyAdminProposal } from "@/lib/ai/admin-apply";
import { getAuthSession } from "@/lib/auth";
import { isAdminAiEnabled } from "@/lib/env";

const schema = z.object({
  proposal: adminProposalSchema,
});

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminAiEnabled()) {
    return NextResponse.json({ error: "Admin AI is disabled. Set ADMIN_AI_ENABLED=true." }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const proposal = parsed.data.proposal;
  const result = await applyAdminProposal({
    proposal,
    actorUserId: session.user.id,
    source: "manual",
  });

  return NextResponse.json({ success: true, result });
}
