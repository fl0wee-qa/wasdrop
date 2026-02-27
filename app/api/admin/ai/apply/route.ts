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
import { slugify } from "@/lib/slug";

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
  } else if (proposal.type === "create_news_article") {
    const sourceFeedUrl =
      proposal.sourceFeedUrl && proposal.sourceFeedUrl.startsWith("http")
        ? proposal.sourceFeedUrl
        : `https://manual.wasdrop.local/source/${slugify(proposal.sourceName)}`;

    const source = await prisma.newsSource.upsert({
      where: { feedUrl: sourceFeedUrl },
      update: { name: proposal.sourceName, category: proposal.category, isEnabled: true },
      create: {
        name: proposal.sourceName,
        feedUrl: sourceFeedUrl,
        category: proposal.category,
        isEnabled: true,
      },
    });

    const baseSlug = slugify(proposal.title);
    const uniqueSlug = `${baseSlug}-${Math.abs(hashCode(proposal.url)).toString(36)}`;

    const article = await prisma.newsArticle.upsert({
      where: { url: proposal.url },
      update: {
        title: proposal.title,
        slug: uniqueSlug,
        sourceId: source.id,
        imageUrl: proposal.imageUrl,
        publishedAt: proposal.publishedAt ? new Date(proposal.publishedAt) : new Date(),
        category: proposal.category,
        contentSnippet: proposal.contentSnippet,
        aiSummary: proposal.aiSummary,
      },
      create: {
        title: proposal.title,
        slug: uniqueSlug,
        sourceId: source.id,
        url: proposal.url,
        imageUrl: proposal.imageUrl,
        publishedAt: proposal.publishedAt ? new Date(proposal.publishedAt) : new Date(),
        category: proposal.category,
        contentSnippet: proposal.contentSnippet,
        aiSummary: proposal.aiSummary,
      },
    });

    result = { newsArticleId: article.id, slug: article.slug };
  } else if (proposal.type === "create_game_deal") {
    const normalizedCountry = getCountryOption(proposal.country ?? "US").code;
    const storeSlug = proposal.storeSlug?.trim() ? proposal.storeSlug : slugify(proposal.storeName);
    const store = await prisma.store.upsert({
      where: { slug: storeSlug },
      update: { name: proposal.storeName },
      create: { name: proposal.storeName, slug: storeSlug },
    });

    const existingGame = await prisma.game.findFirst({
      where: {
        title: {
          equals: proposal.title,
          mode: "insensitive",
        },
      },
    });

    const gameSlug = existingGame ? existingGame.slug : await createUniqueGameSlug(proposal.title);
    const game = existingGame
      ? await prisma.game.update({
          where: { id: existingGame.id },
          data: {
            description: proposal.description ?? existingGame.description,
            developer: proposal.developer ?? existingGame.developer,
            publisher: proposal.publisher ?? existingGame.publisher,
          },
        })
      : await prisma.game.create({
          data: {
            title: proposal.title,
            slug: gameSlug,
            description: proposal.description,
            developer: proposal.developer,
            publisher: proposal.publisher,
          },
        });

    if (proposal.imageUrl) {
      await prisma.gameImage.upsert({
        where: { id: `${game.id}-${store.slug}-cover-admin` },
        update: {
          url: proposal.imageUrl,
          type: "cover",
          sortOrder: 0,
        },
        create: {
          id: `${game.id}-${store.slug}-cover-admin`,
          gameId: game.id,
          url: proposal.imageUrl,
          type: "cover",
          sortOrder: 0,
        },
      });
    }

    const discountPercent =
      typeof proposal.discountPercent === "number"
        ? proposal.discountPercent
        : proposal.originalPriceCents > 0
          ? Math.max(0, Math.round((1 - proposal.priceCents / proposal.originalPriceCents) * 100))
          : 0;

    const deal = await prisma.deal.upsert({
      where: {
        gameId_storeId_country: {
          gameId: game.id,
          storeId: store.id,
          country: normalizedCountry,
        },
      },
      update: {
        currency: proposal.currency,
        priceCents: proposal.priceCents,
        originalPriceCents: proposal.originalPriceCents,
        discountPercent,
        url: proposal.dealUrl,
        startAt: proposal.startAt ? new Date(proposal.startAt) : null,
        endAt: proposal.endAt ? new Date(proposal.endAt) : null,
        lastSeenAt: new Date(),
      },
      create: {
        gameId: game.id,
        storeId: store.id,
        country: normalizedCountry,
        currency: proposal.currency,
        priceCents: proposal.priceCents,
        originalPriceCents: proposal.originalPriceCents,
        discountPercent,
        url: proposal.dealUrl,
        startAt: proposal.startAt ? new Date(proposal.startAt) : null,
        endAt: proposal.endAt ? new Date(proposal.endAt) : null,
      },
    });

    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    await prisma.priceSnapshot.upsert({
      where: {
        gameId_storeId_country_date: {
          gameId: game.id,
          storeId: store.id,
          country: normalizedCountry,
          date: day,
        },
      },
      update: {
        currency: proposal.currency,
        priceCents: proposal.priceCents,
        originalPriceCents: proposal.originalPriceCents,
        discountPercent,
      },
      create: {
        gameId: game.id,
        storeId: store.id,
        country: normalizedCountry,
        currency: proposal.currency,
        date: day,
        priceCents: proposal.priceCents,
        originalPriceCents: proposal.originalPriceCents,
        discountPercent,
      },
    });

    result = {
      gameId: game.id,
      gameSlug: game.slug,
      dealId: deal.id,
      store: store.slug,
      country: normalizedCountry,
    };
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

async function createUniqueGameSlug(title: string) {
  const base = slugify(title);
  const existing = await prisma.game.findUnique({ where: { slug: base } });
  if (!existing) {
    return base;
  }

  return `${base}-${Date.now().toString(36)}`;
}

function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return hash;
}
