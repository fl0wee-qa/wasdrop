import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthSession = vi.fn();

const prisma = {
  notificationEvent: {
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("@/lib/auth", () => ({
  getAuthSession,
}));

vi.mock("@/lib/prisma", () => ({
  prisma,
}));

describe("notifications API", () => {
  beforeEach(() => {
    getAuthSession.mockReset();
    prisma.notificationEvent.findMany.mockReset();
    prisma.notificationEvent.count.mockReset();
    prisma.notificationEvent.updateMany.mockReset();
    prisma.notificationEvent.deleteMany.mockReset();
  });

  it("returns unread count and events", async () => {
    getAuthSession.mockResolvedValue({ user: { id: "u1" } });
    prisma.notificationEvent.findMany.mockResolvedValue([
      { id: "n1", userId: "u1", title: "t", type: "X", isRead: false, createdAt: new Date() },
    ]);
    prisma.notificationEvent.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/account/notifications/route");
    const response = await GET(new Request("http://localhost/api/account/notifications?limit=10"));

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { unreadCount: number; events: unknown[] };
    expect(payload.unreadCount).toBe(1);
    expect(payload.events.length).toBe(1);
  });

  it("marks all notifications as read", async () => {
    getAuthSession.mockResolvedValue({ user: { id: "u1" } });
    prisma.notificationEvent.updateMany.mockResolvedValue({ count: 3 });

    const { PATCH } = await import("@/app/api/account/notifications/route");
    const response = await PATCH(
      new Request("http://localhost/api/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      }),
    );

    expect(response.status).toBe(200);
    expect(prisma.notificationEvent.updateMany).toHaveBeenCalledTimes(1);
  });
});
