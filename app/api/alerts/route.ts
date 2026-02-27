import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { queuePriceAlertNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getCountryOption } from "@/lib/regions";
import { recordUserActivity } from "@/lib/services/deals-service";

const createSchema = z.object({
  gameId: z.string().min(1),
  targetPriceCents: z.coerce.number().int().nonnegative(),
  country: z.string().length(2),
  currency: z.string().length(3),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    include: {
      game: {
        include: {
          images: true,
          deals: {
            where: { country: session.user.preferredCountry ?? "US" },
            include: { store: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const normalizedCountry = getCountryOption(parsed.data.country).code;

  const alert = await prisma.priceAlert.create({
    data: {
      userId: session.user.id,
      gameId: parsed.data.gameId,
      targetPriceCents: parsed.data.targetPriceCents,
      country: normalizedCountry,
      currency: parsed.data.currency,
      isActive: true,
    },
  });

  await queuePriceAlertNotification({
    userId: session.user.id,
    gameId: parsed.data.gameId,
    targetPriceCents: parsed.data.targetPriceCents,
    country: normalizedCountry,
    currency: parsed.data.currency,
  });

  await recordUserActivity({
    userId: session.user.id,
    type: "ALERT_CREATE",
    gameId: parsed.data.gameId,
  });

  return NextResponse.json({ alert });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.priceAlert.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.priceAlert.delete({ where: { id: parsed.data.id } });

  await recordUserActivity({
    userId: session.user.id,
    type: "ALERT_DELETE",
    gameId: existing.gameId,
  });

  return NextResponse.json({ success: true });
}
