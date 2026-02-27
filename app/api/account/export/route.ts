import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, wishlist, alerts, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        preferredCountry: true,
        marketingOptIn: true,
        steamId: true,
        createdAt: true,
      },
    }),
    prisma.wishlistItem.findMany({ where: { userId: session.user.id }, include: { game: true } }),
    prisma.priceAlert.findMany({ where: { userId: session.user.id }, include: { game: true } }),
    prisma.userActivity.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user,
    wishlist,
    alerts,
    activity,
  });
}
