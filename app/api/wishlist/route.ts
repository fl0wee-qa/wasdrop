import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordUserActivity } from "@/lib/services/deals-service";

const schema = z.object({
  gameId: z.string().min(1),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.wishlistItem.findMany({
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

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_gameId: {
        userId: session.user.id,
        gameId: parsed.data.gameId,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      gameId: parsed.data.gameId,
    },
  });

  await recordUserActivity({
    userId: session.user.id,
    type: "WISHLIST_ADD",
    gameId: parsed.data.gameId,
  });

  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.wishlistItem.deleteMany({
    where: {
      userId: session.user.id,
      gameId: parsed.data.gameId,
    },
  });

  await recordUserActivity({
    userId: session.user.id,
    type: "WISHLIST_REMOVE",
    gameId: parsed.data.gameId,
  });

  return NextResponse.json({ success: true });
}
