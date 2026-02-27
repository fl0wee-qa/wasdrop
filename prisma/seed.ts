import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  const stores = [
    { name: "Steam", slug: "steam" },
    { name: "Epic Games Store", slug: "epic-games-store" },
    { name: "Microsoft Store", slug: "microsoft-store" },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: { name: store.name },
      create: store,
    });
  }

  const sources = [
    { name: "IGN PC", feedUrl: "https://feeds.ign.com/ign/all", category: "industry", isEnabled: true },
    {
      name: "Rock Paper Shotgun",
      feedUrl: "https://www.rockpapershotgun.com/feed",
      category: "industry",
      isEnabled: true,
    },
    {
      name: "Eurogamer",
      feedUrl: "https://www.eurogamer.net/feed",
      category: "industry",
      isEnabled: true,
    },
  ];

  for (const source of sources) {
    await prisma.newsSource.upsert({
      where: { feedUrl: source.feedUrl },
      update: {
        name: source.name,
        category: source.category,
        isEnabled: source.isEnabled,
      },
      create: source,
    });
  }

  const hasSeedCuration = await prisma.adminCuration.findFirst({
    where: { title: "Best RPG deals this week" },
  });
  if (!hasSeedCuration) {
    await prisma.adminCuration.create({
      data: {
        type: "featured",
        title: "Best RPG deals this week",
        description: "Seeded curation list for admin dashboard demo.",
        itemsJson: [
          { gameSlug: "baldurs-gate-3" },
          { gameSlug: "cyberpunk-2077" },
        ],
      },
    });
  }

  if (adminEmail) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
