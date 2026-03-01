import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthSession = vi.fn();
const createNotificationEvent = vi.fn();

const prisma = {
  savedFilter: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/auth", () => ({
  getAuthSession,
}));

vi.mock("@/lib/notifications", () => ({
  createNotificationEvent,
}));

vi.mock("@/lib/prisma", () => ({
  prisma,
}));

describe("saved filters API", () => {
  beforeEach(() => {
    getAuthSession.mockReset();
    createNotificationEvent.mockReset();
    prisma.savedFilter.findMany.mockReset();
    prisma.savedFilter.updateMany.mockReset();
    prisma.savedFilter.create.mockReset();
    prisma.savedFilter.findFirst.mockReset();
    prisma.savedFilter.update.mockReset();
    prisma.savedFilter.delete.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/account/saved-filters/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("creates default filter and resets existing defaults", async () => {
    getAuthSession.mockResolvedValue({ user: { id: "u1" } });
    prisma.savedFilter.updateMany.mockResolvedValue({ count: 2 });
    prisma.savedFilter.create.mockResolvedValue({
      id: "f1",
      userId: "u1",
      name: "Top Discounts",
      scope: "deals",
      queryJson: { sort: "discount" },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { POST } = await import("@/app/api/account/saved-filters/route");
    const response = await POST(
      new Request("http://localhost/api/account/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Top Discounts",
          scope: "deals",
          query: { sort: "discount" },
          isDefault: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(prisma.savedFilter.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.savedFilter.create).toHaveBeenCalledTimes(1);
    expect(createNotificationEvent).toHaveBeenCalledTimes(1);
  });
});
