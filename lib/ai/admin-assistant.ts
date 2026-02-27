import { z } from "zod";

import { createChatCompletion, type ChatMessage } from "@/lib/ai/openai-compatible";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const curationItemSchema = z.object({
  gameSlug: z.string().min(1),
});

export const adminProposalSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_curation"),
    curationType: z.string().default("featured"),
    title: z.string().min(1),
    description: z.string().optional(),
    items: z.array(curationItemSchema).min(1),
  }),
  z.object({
    type: z.literal("categorize_news"),
    articleIds: z.array(z.string().min(1)).min(1),
    category: z.string().min(1),
    summary: z.string().optional(),
  }),
  z.object({
    type: z.literal("cleanup_expired_deals"),
    country: z.string().length(2).optional(),
  }),
  z.object({
    type: z.literal("trigger_sync"),
    job: z.enum(["deals", "news"]),
    countries: z.array(z.string().length(2)).optional(),
  }),
]);

export type AdminProposal = z.infer<typeof adminProposalSchema>;

const adminResponseSchema = z.object({
  reply: z.string(),
  proposals: z.array(adminProposalSchema).default([]),
});

function extractJsonObject(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

async function buildAdminContext() {
  const [topDeals, recentNews, expiredDealsCount] = await Promise.all([
    prisma.deal.findMany({
      orderBy: [{ discountPercent: "desc" }, { lastSeenAt: "desc" }],
      take: 10,
      include: {
        game: { select: { title: true, slug: true } },
        store: { select: { name: true } },
      },
    }),
    prisma.newsArticle.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: { id: true, title: true, category: true, source: { select: { name: true } } },
    }),
    prisma.deal.count({
      where: {
        endAt: { lt: new Date() },
      },
    }),
  ]);

  return {
    topDeals: topDeals.map((deal) => ({
      gameTitle: deal.game.title,
      gameSlug: deal.game.slug,
      store: deal.store.name,
      discountPercent: deal.discountPercent,
      priceCents: deal.priceCents,
      currency: deal.currency,
      country: deal.country,
    })),
    recentNews,
    expiredDealsCount,
  };
}

export async function runAdminAssistant(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const e = env();
  if (!e.QWEN_ADMIN_API_KEY || !e.QWEN_ADMIN_BASE_URL) {
    throw new Error("Admin AI is enabled but QWEN_ADMIN_API_KEY or QWEN_ADMIN_BASE_URL is missing.");
  }

  const context = await buildAdminContext();
  const prompt = `You are WASDrop Admin AI assistant.
Rules:
- Human-in-the-loop only. Never claim actions were already applied.
- You may only propose actions; admin applies separately.
- Return strict JSON only:
{
  "reply": "short response",
  "proposals": [
    {
      "type": "create_curation|categorize_news|cleanup_expired_deals|trigger_sync",
      "...": "fields required by that proposal type"
    }
  ]
}
- Keep proposals realistic using provided DB context.
- Do not include secrets or credentials.`;

  const history: ChatMessage[] = messages.slice(-10).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const completion = await createChatCompletion({
    apiKey: e.QWEN_ADMIN_API_KEY,
    baseUrl: e.QWEN_ADMIN_BASE_URL,
    model: e.QWEN_ADMIN_MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "system", content: `Current DB context: ${JSON.stringify(context)}` },
      ...history,
    ],
    temperature: 0.15,
  });

  const raw = completion.content ?? "";
  const parsed = adminResponseSchema.safeParse(extractJsonObject(raw));
  if (parsed.success) {
    return parsed.data;
  }

  return {
    reply: raw || "No response content returned.",
    proposals: [] as AdminProposal[],
  };
}
