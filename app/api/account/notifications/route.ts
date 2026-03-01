import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  id: z.string().min(1).optional(),
  markAllRead: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1).optional(),
  clearRead: z.boolean().optional(),
});

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));

  const [events, unreadCount] = await Promise.all([
    prisma.notificationEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notificationEvent.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ events, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.markAllRead) {
    const updated = await prisma.notificationEvent.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ updatedCount: updated.count });
  }

  if (parsed.data.id) {
    const updated = await prisma.notificationEvent.updateMany({
      where: { id: parsed.data.id, userId: session.user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ updatedCount: updated.count });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.clearRead) {
    const deleted = await prisma.notificationEvent.deleteMany({
      where: { userId: session.user.id, isRead: true },
    });
    return NextResponse.json({ deletedCount: deleted.count });
  }

  if (parsed.data.id) {
    const deleted = await prisma.notificationEvent.deleteMany({
      where: { id: parsed.data.id, userId: session.user.id },
    });
    return NextResponse.json({ deletedCount: deleted.count });
  }

  return NextResponse.json({ error: "Nothing to delete" }, { status: 400 });
}
