import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  itemsJson: z.unknown(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

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

  const curations = await prisma.adminCuration.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ curations });
}

export async function POST(request: Request) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const curation = await prisma.adminCuration.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      itemsJson: parsed.data.itemsJson as Prisma.InputJsonValue,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "ADMIN_CURATION_CREATE",
      metadataJson: { curationId: curation.id },
    },
  });

  return NextResponse.json({ curation });
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

  await prisma.adminCuration.delete({ where: { id: parsed.data.id } });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "ADMIN_CURATION_DELETE",
      metadataJson: { curationId: parsed.data.id },
    },
  });

  return NextResponse.json({ success: true });
}
