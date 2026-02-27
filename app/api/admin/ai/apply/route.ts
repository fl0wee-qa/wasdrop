import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { adminProposalSchema } from "@/lib/ai/admin-assistant";
import { getAuthSession } from "@/lib/auth";
import { isAdminAiEnabled } from "@/lib/env";
import { syncDealsJob } from "@/lib/jobs/sync-deals";
import { syncNewsJob } from "@/lib/jobs/sync-news";
import { prisma } from "@/lib/prisma";
import { getCountryOption } from "@/lib/regions";

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
  let result: unknown;

  if (proposal.type === "create_curation") {
    const created = await prisma.adminCuration.create({
      data: {
        type: proposal.curationType,
        title: proposal.title,
        description: proposal.description,
        itemsJson: proposal.items as Prisma.InputJsonValue,
      },
    });
    result = { curationId: created.id };
  } else if (proposal.type === "categorize_news") {
    const updated = await prisma.newsArticle.updateMany({
      where: { id: { in: proposal.articleIds } },
      data: {
        category: proposal.category,
        ...(proposal.summary ? { aiSummary: proposal.summary } : {}),
      },
    });
    result = { updatedCount: updated.count };
  } else if (proposal.type === "cleanup_expired_deals") {
    const normalizedCountry = proposal.country ? getCountryOption(proposal.country).code : undefined;
    const deleted = await prisma.deal.deleteMany({
      where: {
        endAt: { lt: new Date() },
        ...(normalizedCountry ? { country: normalizedCountry } : {}),
      },
    });
    result = { deletedCount: deleted.count, country: normalizedCountry ?? "ALL" };
  } else if (proposal.type === "trigger_sync") {
    if (proposal.job === "deals") {
      result = await syncDealsJob(proposal.countries);
    } else {
      result = await syncNewsJob();
    }
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "ADMIN_AI_APPLY_PROPOSAL",
      metadataJson: {
        proposal,
        result,
      } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ success: true, result });
}
