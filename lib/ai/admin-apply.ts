import { Prisma, type PrismaClient } from "@prisma/client";

import type { AdminProposal } from "@/lib/ai/admin-assistant";
import { syncDealsJob } from "@/lib/jobs/sync-deals";
import { syncNewsJob } from "@/lib/jobs/sync-news";
import { prisma } from "@/lib/prisma";
import { getCountryOption } from "@/lib/regions";
import { slugify } from "@/lib/slug";

type ApplyInput = {
  proposal: AdminProposal;
  actorUserId: string;
  source: "manual" | "auto";
};

export async function applyAdminProposal(input: ApplyInput, txClient?: PrismaClient) {
  const db = txClient ?? prisma;
  const { proposal } = input;
  let result: unknown;

  if (proposal.type === "create_curation") {
    const created = await db.adminCuration.create({
      data: {
        type: proposal.curationType,
        title: proposal.title,
        description: proposal.description,
        itemsJson: proposal.items as Prisma.InputJsonValue,
      },
    });
    result = { curationId: created.id };
  } else if (proposal.type === "categorize_news") {
    const updated = await db.newsArticle.updateMany({
      where: { id: { in: proposal.articleIds } },
      data: {
        category: proposal.category,
        ...(proposal.summary ? { aiSummary: proposal.summary } : {}),
      },
    });
    result = { updatedCount: updated.count };
  } else if (proposal.type === "cleanup_expired_deals") {
    const normalizedCountry = proposal.country ? getCountryOption(proposal.country).code : undefined;
    const deleted = await db.deal.deleteMany({
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

    const source = await db.newsSource.upsert({
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

    const article = await db.newsArticle.upsert({
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
    const store = await db.store.upsert({
      where: { slug: storeSlug },
      update: { name: proposal.storeName },
      create: { name: proposal.storeName, slug: storeSlug },
    });

    const existingGame = await db.game.findFirst({
      where: {
        title: {
          equals: proposal.title,
          mode: "insensitive",
        },
      },
    });

    const gameSlug = existingGame ? existingGame.slug : await createUniqueGameSlug(proposal.title, db);
    const game = existingGame
      ? await db.game.update({
          where: { id: existingGame.id },
          data: {
            description: proposal.description ?? existingGame.description,
            developer: proposal.developer ?? existingGame.developer,
            publisher: proposal.publisher ?? existingGame.publisher,
          },
        })
      : await db.game.create({
          data: {
            title: proposal.title,
            slug: gameSlug,
            description: proposal.description,
            developer: proposal.developer,
            publisher: proposal.publisher,
          },
        });

    if (proposal.imageUrl) {
      await db.gameImage.upsert({
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

    const deal = await db.deal.upsert({
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
    await db.priceSnapshot.upsert({
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

  await db.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.source === "auto" ? "ADMIN_AI_AUTO_APPLY_PROPOSAL" : "ADMIN_AI_APPLY_PROPOSAL",
      metadataJson: {
        proposal,
        result,
      } as Prisma.InputJsonValue,
    },
  });

  return result;
}

async function createUniqueGameSlug(title: string, db: PrismaClient) {
  const base = slugify(title);
  const existing = await db.game.findUnique({ where: { slug: base } });
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
