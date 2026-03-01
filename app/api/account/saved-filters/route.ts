import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { createNotificationEvent } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  scope: z.string().min(1).max(40).default("deals"),
  query: z.record(z.string(), z.unknown()),
  isDefault: z.boolean().optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  isDefault: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await prisma.savedFilter.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ filters });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.isDefault) {
    await prisma.savedFilter.updateMany({
      where: { userId: session.user.id, scope: payload.scope },
      data: { isDefault: false },
    });
  }

  const filter = await prisma.savedFilter.create({
    data: {
      userId: session.user.id,
      name: payload.name,
      scope: payload.scope,
      queryJson: payload.query as Prisma.InputJsonValue,
      isDefault: payload.isDefault ?? false,
    },
  });

  await createNotificationEvent({
    userId: session.user.id,
    type: "SAVED_FILTER_CREATED",
    title: "Filter preset saved",
    body: `Saved filter \"${payload.name}\" is now available.`,
    linkUrl: "/account",
    metadataJson: { savedFilterId: filter.id, scope: payload.scope },
  });

  return NextResponse.json({ filter });
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

  const existing = await prisma.savedFilter.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
    select: { id: true, scope: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.isDefault) {
    await prisma.savedFilter.updateMany({
      where: { userId: session.user.id, scope: existing.scope },
      data: { isDefault: false },
    });
  }

  const filter = await prisma.savedFilter.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(typeof parsed.data.isDefault === "boolean" ? { isDefault: parsed.data.isDefault } : {}),
    },
  });

  return NextResponse.json({ filter });
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

  const existing = await prisma.savedFilter.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedFilter.delete({ where: { id: existing.id } });

  await createNotificationEvent({
    userId: session.user.id,
    type: "SAVED_FILTER_DELETED",
    title: "Filter preset removed",
    body: `Saved filter \"${existing.name}\" was removed.`,
    linkUrl: "/account",
    metadataJson: { savedFilterId: existing.id },
  });

  return NextResponse.json({ success: true });
}
