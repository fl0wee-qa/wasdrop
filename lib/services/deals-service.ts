import { subDays } from "date-fns";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCountryOption } from "@/lib/regions";
import { slugify } from "@/lib/slug";
import { getPrimaryDealsAdapter } from "@/lib/source-adapters/registry";
import { fetchSteamMetadata } from "@/lib/source-adapters/steam-metadata-adapter";
import type { AdapterDeal } from "@/lib/source-adapters/types";

export type DealFilters = {
  country: string;
  search?: string;
  stores?: string[];
  minDiscount?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: "discount" | "price_asc" | "price_desc" | "latest";
  page?: number;
  pageSize?: number;
};

function mergeExternalIds(
  current: Record<string, string> | null | undefined,
  storeSlug: string,
  externalGameId: string,
) {
  return {
    ...(current ?? {}),
    [storeSlug]: externalGameId,
  };
}

function getStoreFallback(name: string) {
  return {
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-"),
  };
}

async function upsertDeal(country: string, row: AdapterDeal) {
  const store = await prisma.store.upsert({
    where: { slug: row.store.slug },
    update: { name: row.store.name },
    create: { name: row.store.name, slug: row.store.slug },
  });

  const baseSlug = slugify(row.title);
  const existingBySlug = await prisma.game.findUnique({
    where: { slug: baseSlug },
  });

  const finalSlug = existingBySlug && existingBySlug.title !== row.title ? `${baseSlug}-${row.externalGameId}` : baseSlug;

  const game = await prisma.game.upsert({
    where: { slug: finalSlug },
    update: {
      title: row.title,
      description: row.description ?? undefined,
      releaseDate: row.releaseDate ?? undefined,
      developer: row.developer ?? undefined,
      publisher: row.publisher ?? undefined,
      genresJson: row.genres ?? undefined,
      systemReqMin: row.systemReqMin ?? undefined,
      systemReqRec: row.systemReqRec ?? undefined,
      externalIdsJson: mergeExternalIds(
        (existingBySlug?.externalIdsJson as Record<string, string> | null | undefined) ?? {},
        row.store.slug,
        row.externalGameId,
      ),
    },
    create: {
      title: row.title,
      slug: finalSlug,
      description: row.description,
      releaseDate: row.releaseDate,
      developer: row.developer,
      publisher: row.publisher,
      genresJson: row.genres,
      systemReqMin: row.systemReqMin,
      systemReqRec: row.systemReqRec,
      externalIdsJson: { [row.store.slug]: row.externalGameId },
    },
  });

  if (row.imageUrl) {
    await prisma.gameImage.upsert({
      where: {
        id: `${game.id}-${row.store.slug}-cover`,
      },
      update: {
        url: row.imageUrl,
        type: "cover",
      },
      create: {
        id: `${game.id}-${row.store.slug}-cover`,
        gameId: game.id,
        url: row.imageUrl,
        type: "cover",
        sortOrder: 0,
      },
    });
  }

  await prisma.deal.upsert({
    where: {
      gameId_storeId_country: {
        gameId: game.id,
        storeId: store.id,
        country,
      },
    },
    update: {
      currency: row.currency,
      priceCents: row.priceCents,
      originalPriceCents: row.originalPriceCents,
      discountPercent: row.discountPercent,
      url: row.url,
      startAt: row.startAt ?? null,
      endAt: row.endAt ?? null,
      lastSeenAt: new Date(),
    },
    create: {
      gameId: game.id,
      storeId: store.id,
      country,
      currency: row.currency,
      priceCents: row.priceCents,
      originalPriceCents: row.originalPriceCents,
      discountPercent: row.discountPercent,
      url: row.url,
      startAt: row.startAt,
      endAt: row.endAt,
    },
  });

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  await prisma.priceSnapshot.upsert({
    where: {
      gameId_storeId_country_date: {
        gameId: game.id,
        storeId: store.id,
        country,
        date: day,
      },
    },
    update: {
      currency: row.currency,
      priceCents: row.priceCents,
      originalPriceCents: row.originalPriceCents,
      discountPercent: row.discountPercent,
    },
    create: {
      gameId: game.id,
      storeId: store.id,
      country,
      currency: row.currency,
      date: day,
      priceCents: row.priceCents,
      originalPriceCents: row.originalPriceCents,
      discountPercent: row.discountPercent,
    },
  });

  return game;
}

export async function syncDeals(country: string) {
  const selectedCountry = getCountryOption(country).code;
  const adapter = getPrimaryDealsAdapter();
  const rows = await adapter.getDeals(selectedCountry);

  let created = 0;

  for (const row of rows) {
    const game = await upsertDeal(selectedCountry, row);
    const steamAppId = String(row.metadata?.steamAppId ?? "").trim();

    if (steamAppId && !game.systemReqMin && !game.systemReqRec) {
      const metadata = await fetchSteamMetadata(steamAppId);
      if (metadata) {
        await prisma.game.update({
          where: { id: game.id },
          data: {
            description: game.description ?? metadata.description ?? undefined,
            developer: game.developer ?? metadata.developers?.join(", ") ?? undefined,
            publisher: game.publisher ?? metadata.publishers?.join(", ") ?? undefined,
            systemReqMin: game.systemReqMin ?? metadata.pcRequirements?.minimum ?? undefined,
            systemReqRec: game.systemReqRec ?? metadata.pcRequirements?.recommended ?? undefined,
            steamAppId,
          },
        });

        for (const [index, screenshot] of (metadata.screenshots ?? []).slice(0, 6).entries()) {
          await prisma.gameImage.upsert({
            where: {
              id: `${game.id}-steam-ss-${index}`,
            },
            update: {
              url: screenshot,
              type: "screenshot",
              sortOrder: index,
            },
            create: {
              id: `${game.id}-steam-ss-${index}`,
              gameId: game.id,
              url: screenshot,
              type: "screenshot",
              sortOrder: index,
            },
          });
        }
      }
    }

    created += 1;
  }

  await prisma.deal.deleteMany({
    where: {
      country: selectedCountry,
      lastSeenAt: {
        lt: subDays(new Date(), 2),
      },
    },
  });

  return { count: created, adapter: adapter.name, country: selectedCountry };
}

export async function getDeals(filters: DealFilters) {
  const country = getCountryOption(filters.country).code;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 24;
  const skip = (page - 1) * pageSize;

  const orderBy =
    filters.sort === "price_asc"
      ? { priceCents: "asc" as const }
      : filters.sort === "price_desc"
        ? { priceCents: "desc" as const }
        : filters.sort === "latest"
          ? { lastSeenAt: "desc" as const }
          : { discountPercent: "desc" as const };

  const where = {
    country,
    ...(filters.minDiscount ? { discountPercent: { gte: filters.minDiscount } } : {}),
    ...(typeof filters.minPriceCents === "number" || typeof filters.maxPriceCents === "number"
      ? {
          priceCents: {
            ...(typeof filters.minPriceCents === "number" ? { gte: filters.minPriceCents } : {}),
            ...(typeof filters.maxPriceCents === "number" ? { lte: filters.maxPriceCents } : {}),
          },
        }
      : {}),
    ...(filters.stores?.length
      ? {
          store: {
            slug: {
              in: filters.stores,
            },
          },
        }
      : {}),
    ...(filters.search
      ? {
          game: {
            title: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        game: {
          include: {
            images: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        store: true,
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.deal.count({ where }),
  ]);

  return {
    country,
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeaturedDeals(country: string, limit = 10) {
  const data = await getDeals({ country, sort: "discount", page: 1, pageSize: limit });
  return data.items;
}

export async function getTrendingDeals(country: string, limit = 10) {
  const data = await getDeals({ country, sort: "latest", page: 1, pageSize: limit });
  return data.items;
}

export async function getFreebies(country: string, limit = 10) {
  return prisma.deal.findMany({
    where: {
      country: getCountryOption(country).code,
      priceCents: 0,
    },
    include: {
      game: {
        include: {
          images: true,
        },
      },
      store: true,
    },
    orderBy: {
      lastSeenAt: "desc",
    },
    take: limit,
  });
}

export async function getGameBySlug(slug: string, country: string) {
  const selectedCountry = getCountryOption(country).code;

  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
      deals: {
        where: { country: selectedCountry },
        include: { store: true },
        orderBy: { priceCents: "asc" },
      },
      snapshots: {
        where: {
          country: selectedCountry,
          date: { gte: subDays(new Date(), 90) },
        },
        include: { store: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!game) {
    return null;
  }

  const similarGames = await prisma.game.findMany({
    where: {
      id: { not: game.id },
    },
    include: {
      images: true,
      deals: {
        where: { country: selectedCountry },
        include: { store: true },
      },
    },
    take: 6,
  });

  return {
    game,
    similarGames,
  };
}

export async function recordUserActivity(input: {
  userId: string;
  type: "VIEW_GAME" | "WISHLIST_ADD" | "WISHLIST_REMOVE" | "ALERT_CREATE" | "ALERT_DELETE";
  gameId?: string;
  metadataJson?: Record<string, unknown>;
}) {
  await prisma.userActivity.create({
    data: {
      userId: input.userId,
      type: input.type,
      gameId: input.gameId,
      metadataJson: input.metadataJson as Prisma.InputJsonValue | undefined,
    },
  });
}

export function normalizeStore(name: string) {
  return getStoreFallback(name);
}
