import { NextResponse } from "next/server";
import { z } from "zod";

import { createChatCompletion, type ChatMessage } from "@/lib/ai/openai-compatible";
import { runUserToolCall, userChatTools } from "@/lib/ai/user-chat-tools";
import { env, isUserAiChatEnabled } from "@/lib/env";
import { getAuthSession } from "@/lib/auth";
import { consumeRateLimit, getClientIp } from "@/lib/ip-rate-limit";
import { resolveCountry } from "@/lib/services/user-preferences";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

function systemPrompt(country: string) {
  return `You are WASDrop Assistant. 
- Only answer using data from provided tool outputs.
- If user asks for unavailable data, state limitation clearly.
- Focus on gaming deals/freebies/news.
- Region defaults to ${country} unless user asks otherwise.
- Keep recommendations concise and actionable.
- Never invent prices or links.`;
}

export async function POST(request: Request) {
  if (!isUserAiChatEnabled()) {
    return NextResponse.json({ error: "AI chat is disabled. Set AI_CHAT_ENABLED=true to enable it." }, { status: 503 });
  }

  const e = env();
  if (!e.QWEN_USER_API_KEY || !e.QWEN_USER_BASE_URL) {
    return NextResponse.json(
      { error: "AI chat is enabled but QWEN_USER_API_KEY or QWEN_USER_BASE_URL is missing." },
      { status: 503 },
    );
  }

  const session = await getAuthSession();
  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit({
    bucket: "ai.user.chat",
    key: session?.user?.id ?? ip,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const country = await resolveCountry(session?.user?.id);
  const conversation = parsed.data.messages.slice(-12).map<ChatMessage>((message) => ({
    role: message.role,
    content: message.content,
  }));

  const baseMessages: ChatMessage[] = [{ role: "system", content: systemPrompt(country) }, ...conversation];
  try {
    const first = await createChatCompletion({
      apiKey: e.QWEN_USER_API_KEY,
      baseUrl: e.QWEN_USER_BASE_URL,
      model: e.QWEN_USER_MODEL,
      messages: baseMessages,
      tools: userChatTools,
      temperature: 0.2,
    });

    if (first.tool_calls?.length) {
      const toolMessages: ChatMessage[] = [];
      for (const call of first.tool_calls) {
        const result = await runUserToolCall({
          name: call.function.name,
          args: call.function.arguments,
          defaultCountry: country,
        });
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(result),
        });
      }

      const second = await createChatCompletion({
        apiKey: e.QWEN_USER_API_KEY,
        baseUrl: e.QWEN_USER_BASE_URL,
        model: e.QWEN_USER_MODEL,
        messages: [
          ...baseMessages,
          {
            role: "assistant",
            content: first.content,
            tool_calls: first.tool_calls,
          },
          ...toolMessages,
        ],
        temperature: 0.2,
      });

      return NextResponse.json({
        message: second.content ?? "No response content returned.",
        rateLimit: {
          remaining: rateLimit.remaining,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      });
    }

    return NextResponse.json({
      message: first.content ?? "No response content returned.",
      rateLimit: {
        remaining: rateLimit.remaining,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI chat request failed." },
      { status: 500 },
    );
  }
}
