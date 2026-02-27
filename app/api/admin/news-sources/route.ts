import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const upsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  feedUrl: z.string().url(),
  category: z.string().min(1),
  isEnabled: z.boolean().default(true),
});

const deleteSchema = z.object({ id: z.string().min(1) });

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session.user;
}

export async function GET() {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sources = await prisma.newsSource.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = upsertSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const source = parsed.data.id
    ? await prisma.newsSource.update({
        where: { id: parsed.data.id },
        data: {
          name: parsed.data.name,
          feedUrl: parsed.data.feedUrl,
          category: parsed.data.category,
          isEnabled: parsed.data.isEnabled,
        },
      })
    : await prisma.newsSource.create({
        data: {
          name: parsed.data.name,
          feedUrl: parsed.data.feedUrl,
          category: parsed.data.category,
          isEnabled: parsed.data.isEnabled,
        },
      });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "ADMIN_NEWS_SOURCE_UPSERT",
      metadataJson: { sourceId: source.id },
    },
  });

  return NextResponse.json({ source });
}

export async function DELETE(request: Request) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.newsSource.delete({ where: { id: parsed.data.id } });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "ADMIN_NEWS_SOURCE_DELETE",
      metadataJson: { sourceId: parsed.data.id },
    },
  });

  return NextResponse.json({ success: true });
}
