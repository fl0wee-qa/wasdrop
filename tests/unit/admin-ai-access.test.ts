import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitBuckets } from "@/lib/ip-rate-limit";

const getAuthSession = vi.fn();
const isAdminAiEnabled = vi.fn(() => true);
const isAdminAiAutoApplyEnabled = vi.fn(() => false);
const runAdminAssistant = vi.fn(async () => ({ reply: "ok", proposals: [] }));
const applyAdminProposal = vi.fn(async () => ({ ok: true }));

vi.mock("@/lib/auth", () => ({
  getAuthSession,
}));

vi.mock("@/lib/env", () => ({
  isAdminAiEnabled,
  isAdminAiAutoApplyEnabled,
}));

vi.mock("@/lib/ai/admin-assistant", () => ({
  runAdminAssistant,
}));

vi.mock("@/lib/ai/admin-apply", () => ({
  applyAdminProposal,
}));

describe("admin AI access control", () => {
  beforeEach(() => {
    getAuthSession.mockReset();
    runAdminAssistant.mockReset();
    runAdminAssistant.mockResolvedValue({ reply: "ok", proposals: [] });
    applyAdminProposal.mockReset();
    applyAdminProposal.mockResolvedValue({ ok: true });
    isAdminAiEnabled.mockReset();
    isAdminAiEnabled.mockReturnValue(true);
    isAdminAiAutoApplyEnabled.mockReset();
    isAdminAiAutoApplyEnabled.mockReturnValue(false);
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

  it("auto-applies proposals when ADMIN_AI_AUTO_APPLY is enabled", async () => {
    isAdminAiAutoApplyEnabled.mockReturnValue(true);
    getAuthSession.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    runAdminAssistant.mockResolvedValue({
      reply: "Applying now",
      proposals: [
        {
          type: "create_curation",
          curationType: "featured",
          title: "Famous Deals",
          items: [{ gameSlug: "cyberpunk-2077" }],
        },
      ],
    });

    const { POST } = await import("@/app/api/admin/ai/chat/route");
    const response = await POST(
      new Request("http://localhost/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "sync and feature famous games" }] }),
      }),
    );

    const payload = (await response.json()) as {
      autoApplied?: boolean;
      applied?: Array<{ success: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(payload.autoApplied).toBe(true);
    expect(payload.applied?.[0]?.success).toBe(true);
    expect(applyAdminProposal).toHaveBeenCalledTimes(1);
  });
});
