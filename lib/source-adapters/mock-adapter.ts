import type {
  AdapterDeal,
  AdapterGameDetails,
  AdapterPricePoint,
  DealsSourceAdapter,
} from "@/lib/source-adapters/types";

export class MockDealsAdapter implements DealsSourceAdapter {
  name = "mock";

  async getDeals(country: string): Promise<AdapterDeal[]> {
    return [
      {
        externalGameId: "mock-1",
        title: "Nebula Strikers",
        description: "Arcade space shooter.",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
        screenshots: [],
        store: { name: "Steam", slug: "steam" },
        country,
        currency: "USD",
        priceCents: 499,
        originalPriceCents: 1999,
        discountPercent: 75,
        url: "https://store.steampowered.com",
      },
      {
        externalGameId: "mock-2",
        title: "Crystal Frontiers",
        description: "Exploration RPG.",
        imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
        screenshots: [],
        store: { name: "Epic Games Store", slug: "epic-games-store" },
        country,
        currency: "USD",
        priceCents: 0,
        originalPriceCents: 1499,
        discountPercent: 100,
        url: "https://store.epicgames.com",
        isFreebie: true,
      },
      {
        externalGameId: "mock-3",
        title: "Steel Circuit",
        description: "Mech tactics.",
        imageUrl: "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1200&q=80",
        screenshots: [],
        store: { name: "Microsoft Store", slug: "microsoft-store" },
        country,
        currency: "USD",
        priceCents: 2999,
        originalPriceCents: 5999,
        discountPercent: 50,
        url: "https://www.microsoft.com/store",
      },
    ];
  }

  async getGameDetails(externalGameId: string): Promise<AdapterGameDetails | null> {
    return {
      externalGameId,
      title: `Mock Game ${externalGameId}`,
      description: "Running in mock mode because aggregator credentials are missing.",
      coverUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
      screenshots: [
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      ],
      systemReqMin: "OS: Windows 10; CPU: i5; RAM: 8 GB; GPU: GTX 970",
      systemReqRec: "OS: Windows 11; CPU: i7; RAM: 16 GB; GPU: RTX 3060",
    };
  }

  async getPriceHistory(): Promise<AdapterPricePoint[]> {
    return [];
  }
}

export const mockDealsAdapter = new MockDealsAdapter();
