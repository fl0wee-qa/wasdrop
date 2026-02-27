import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitBuckets } from "@/lib/ip-rate-limit";

const getAuthSession = vi.fn();
const createChatCompletion = vi.fn(async () => ({ content: "ok" }));

vi.mock("@/lib/auth", () => ({
  getAuthSession,
}));

vi.mock("@/lib/env", () => ({
  isUserAiChatEnabled: () => true,
  env: () => ({
    QWEN_USER_API_KEY: "test-key",
    QWEN_USER_BASE_URL: "https://example.ai",
    QWEN_USER_MODEL: "qwen-test-model",
  }),
}));

vi.mock("@/lib/services/user-preferences", () => ({
  resolveCountry: vi.fn(async () => "US"),
}));

vi.mock("@/lib/ai/openai-compatible", () => ({
  createChatCompletion,
}));

describe("user AI endpoint rate limit", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
    getAuthSession.mockReset();
    createChatCompletion.mockClear();
    getAuthSession.mockResolvedValue(null);
  });

  it("returns 429 after limit is exceeded for same IP", async () => {
    const { POST } = await import("@/app/api/chat/user/route");

    let lastStatus = 200;
    for (let index = 0; index < 31; index += 1) {
      const response = await POST(
        new Request("http://localhost/api/chat/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.1",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Show me steam deals" }],
          }),
        }),
      );
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
