import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitBuckets } from "@/lib/ip-rate-limit";

const getAuthSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  getAuthSession,
}));

vi.mock("@/lib/env", () => ({
  isAdminAiEnabled: () => true,
}));

vi.mock("@/lib/ai/admin-assistant", () => ({
  runAdminAssistant: vi.fn(async () => ({ reply: "ok", proposals: [] })),
}));

describe("admin AI access control", () => {
  beforeEach(() => {
    getAuthSession.mockReset();
    resetRateLimitBuckets();
  });

  it("returns 403 for anonymous users", async () => {
    getAuthSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/ai/chat/route");
    const response = await POST(
      new Request("http://localhost/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns 403 for non-admin users", async () => {
    getAuthSession.mockResolvedValue({
      user: {
        id: "u1",
        role: "USER",
      },
    });

    const { POST } = await import("@/app/api/admin/ai/chat/route");
    const response = await POST(
      new Request("http://localhost/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
