import { prisma } from "@/lib/prisma";
import { getCountryOption } from "@/lib/regions";

export const userChatTools = [
  {
    type: "function" as const,
    function: {
      name: "search_deals",
      description: "Search current deals in the selected region by title/store/price/discount.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          store: { type: "string", description: "Store slug, e.g. steam, epic-games-store" },
          maxPriceCents: { type: "number" },
          minDiscountPercent: { type: "number" },
          onlyFreebies: { type: "boolean" },
          country: { type: "string", description: "Two-letter country code (optional)." },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_trending_deals",
      description: "Get recently seen trending deals.",
      parameters: {
        type: "object",
        properties: {
          country: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_recent_news",
      description: "Get recent gamer-relevant industry news.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
];

function parseArgs(raw: string) {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function runUserToolCall(input: {
  name: string;
  args: string;
  defaultCountry: string;
}) {
  const args = parseArgs(input.args);
  const limit = Math.min(20, Math.max(1, Number(args.limit ?? 8) || 8));

  if (input.name === "search_deals") {
    const country = getCountryOption((args.country as string | undefined) ?? input.defaultCountry).code;
    const query = typeof args.query === "string" ? args.query : undefined;
    const store = typeof args.store === "string" ? args.store : undefined;
    const maxPriceCents = Number(args.maxPriceCents);
    const minDiscountPercent = Number(args.minDiscountPercent);
    const onlyFreebies = Boolean(args.onlyFreebies);

    const deals = await prisma.deal.findMany({
      where: {
        country,
        ...(query
          ? {
              game: {
                title: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        ...(store ? { store: { slug: store } } : {}),
        ...(Number.isFinite(maxPriceCents) ? { priceCents: { lte: maxPriceCents } } : {}),
        ...(Number.isFinite(minDiscountPercent) ? { discountPercent: { gte: minDiscountPercent } } : {}),
        ...(onlyFreebies ? { priceCents: 0 } : {}),
      },
      include: {
        game: {
          select: {
            title: true,
            slug: true,
          },
        },
        store: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ discountPercent: "desc" }, { lastSeenAt: "desc" }],
      take: limit,
    });

    return {
      country,
      deals: deals.map((item) => ({
        gameTitle: item.game.title,
        gameSlug: item.game.slug,
        store: item.store.name,
        storeSlug: item.store.slug,
        priceCents: item.priceCents,
        originalPriceCents: item.originalPriceCents,
        discountPercent: item.discountPercent,
        currency: item.currency,
        url: item.url,
      })),
    };
  }

  if (input.name === "get_trending_deals") {
    const country = getCountryOption((args.country as string | undefined) ?? input.defaultCountry).code;
    const deals = await prisma.deal.findMany({
      where: { country },
      include: {
        game: { select: { title: true, slug: true } },
        store: { select: { name: true } },
      },
      orderBy: { lastSeenAt: "desc" },
      take: limit,
    });

    return {
      country,
      deals: deals.map((item) => ({
        gameTitle: item.game.title,
        gameSlug: item.game.slug,
        store: item.store.name,
        priceCents: item.priceCents,
        originalPriceCents: item.originalPriceCents,
        discountPercent: item.discountPercent,
        currency: item.currency,
      })),
    };
  }

  if (input.name === "get_recent_news") {
    const query = typeof args.query === "string" ? args.query : undefined;
    const category = typeof args.category === "string" ? args.category : undefined;

    const news = await prisma.newsArticle.findMany({
      where: {
        ...(query
          ? {
              title: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
        ...(category ? { category } : {}),
      },
      include: {
        source: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    return {
      news: news.map((item) => ({
        title: item.title,
        slug: item.slug,
        category: item.category,
        publishedAt: item.publishedAt.toISOString(),
        source: item.source.name,
        url: item.url,
        snippet: item.contentSnippet,
      })),
    };
  }

  return { error: `Unknown tool: ${input.name}` };
}
