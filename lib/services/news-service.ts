import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { slugify } from "@/lib/slug";
import { readFeed } from "@/lib/news/rss";
import { env } from "@/lib/env";

async function maybeSummarize(contentSnippet: string | undefined) {
  const e = env();
  if (e.NEWS_SUMMARY_ENABLED !== "true" || !contentSnippet || !e.OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await withRetry(() =>
      fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${e.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: `Summarize this gamer-relevant news in 2 concise sentences: ${contentSnippet}`,
          max_output_tokens: 120,
        }),
      }),
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { output_text?: string };
    return json.output_text ?? null;
  } catch {
    return null;
  }
}

export async function syncNews() {
  const sources = await prisma.newsSource.findMany({
    where: { isEnabled: true },
  });

  let inserted = 0;

  for (const source of sources) {
    const items = await readFeed(source.feedUrl);

    for (const item of items.slice(0, env().NEWS_SYNC_LIMIT)) {
      const slug = slugify(item.title);
      const maybeExisting = await prisma.newsArticle.findUnique({
        where: { url: item.url },
      });

      if (maybeExisting) {
        continue;
      }

      const aiSummary = await maybeSummarize(item.contentSnippet);

      await prisma.newsArticle.create({
        data: {
          title: item.title,
          slug: `${slug}-${Math.abs(hashCode(item.url)).toString(36)}`,
          sourceId: source.id,
          url: item.url,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          category: source.category,
          contentSnippet: item.contentSnippet,
          aiSummary,
        },
      });

      inserted += 1;
    }
  }

  return { inserted };
}

function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return hash;
}

export async function getNewsPage(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(input.search
      ? {
          title: {
            contains: input.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(input.category
      ? {
          category: input.category,
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      include: { source: true },
      orderBy: { publishedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getArticleBySlug(slug: string) {
  return prisma.newsArticle.findUnique({
    where: { slug },
    include: { source: true },
  });
}

export async function getLatestNews(limit = 6) {
  return prisma.newsArticle.findMany({
    include: { source: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function recordNewsView(userId: string, newsArticleId: string) {
  await prisma.userActivity.create({
    data: {
      userId,
      type: "VIEW_NEWS",
      newsArticleId,
    },
  });
}
