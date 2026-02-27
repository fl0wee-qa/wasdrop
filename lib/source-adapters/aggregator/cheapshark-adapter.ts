import { env, isMockModeEnabled } from "@/lib/env";
import { getCountryOption } from "@/lib/regions";
import { networkLimiter } from "@/lib/rate-limit";
import { withRetry } from "@/lib/retry";
import type {
  AdapterDeal,
  AdapterGameDetails,
  AdapterPricePoint,
  DealsSourceAdapter,
} from "@/lib/source-adapters/types";

const SOURCE_NAME = "cheapshark";

type CheapSharkStore = {
  storeID: string;
  storeName: string;
  isActive: 0 | 1;
};

type CheapSharkDeal = {
  dealID: string;
  gameID: string;
  title: string;
  normalPrice: string;
  salePrice: string;
  savings: string;
  thumb: string;
  steamAppID: string;
  storeID: string;
  releaseDate: number;
};

type CheapSharkGameLookup = {
  info: {
    title: string;
    steamAppID: string | null;
    thumb: string;
  };
};

function getHeaders() {
  const headers: Record<string, string> = { "User-Agent": "WASDrop/1.0" };
  const key = env().DEALS_API_KEY;
  if (key) {
    headers["x-api-key"] = key;
  }

  return headers;
}

async function fetchJson<T>(path: string) {
  const baseUrl = env().DEALS_API_BASE_URL;
  const response = await withRetry(() =>
    fetch(`${baseUrl}${path}`, {
      headers: getHeaders(),
      next: { revalidate: 60 * 30 },
    }),
  );

  if (!response.ok) {
    throw new Error(`Deals API failed at ${path} with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function resolveStoreMap() {
  const stores = await networkLimiter(() => fetchJson<CheapSharkStore[]>("/stores"));
  const activeStores = stores.filter((store) => store.isActive === 1);
  const preferred = activeStores.filter((store) => {
    const name = store.storeName.toLowerCase();
    return name.includes("steam") || name.includes("epic") || name.includes("microsoft");
  });

  const selected = preferred.length >= 3 ? preferred : activeStores.slice(0, 6);

  return new Map(selected.map((store) => [store.storeID, store.storeName]));
}

function buildStoreSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function toDeal(country: string, currency: string, storeName: string, row: CheapSharkDeal): AdapterDeal {
  const salePrice = Math.round(Number(row.salePrice) * 100);
  const normalPrice = Math.round(Number(row.normalPrice) * 100);
  const releaseDate = row.releaseDate ? new Date(row.releaseDate * 1000) : null;

  return {
    externalGameId: row.gameID,
    title: row.title,
    releaseDate,
    imageUrl: row.thumb,
    screenshots: [],
    store: {
      name: storeName,
      slug: buildStoreSlug(storeName),
    },
    country,
    currency,
    priceCents: salePrice,
    originalPriceCents: normalPrice,
    discountPercent: Math.round(Number(row.savings)),
    url: `https://www.cheapshark.com/redirect?dealID=${row.dealID}`,
    isFreebie: salePrice === 0,
    metadata: {
      steamAppId: row.steamAppID || null,
    },
  };
}

export class CheapSharkAdapter implements DealsSourceAdapter {
  name = SOURCE_NAME;

  async getDeals(country: string): Promise<AdapterDeal[]> {
    if (isMockModeEnabled()) {
      return [];
    }

    const selectedCountry = getCountryOption(country).code;
    const currency = getCountryOption(selectedCountry).currency;
    const storeMap = await resolveStoreMap();

    const responses = await Promise.all(
      Array.from(storeMap.keys()).map((storeId) =>
        networkLimiter(() => fetchJson<CheapSharkDeal[]>(`/deals?storeID=${storeId}&pageSize=60&onSale=1`)),
      ),
    );

    return responses.flatMap((deals, index) => {
      const storeId = Array.from(storeMap.keys())[index];
      const storeName = storeMap.get(storeId) ?? "Unknown Store";
      return deals.map((deal) => toDeal(selectedCountry, currency, storeName, deal));
    });
  }

  async getGameDetails(externalGameId: string): Promise<AdapterGameDetails | null> {
    if (isMockModeEnabled()) {
      return null;
    }

    try {
      const game = await networkLimiter(() => fetchJson<CheapSharkGameLookup>(`/games?id=${externalGameId}`));
      return {
        externalGameId,
        title: game.info.title,
        description: null,
        coverUrl: game.info.thumb,
        screenshots: game.info.thumb ? [game.info.thumb] : [],
      };
    } catch {
      return null;
    }
  }

  async getPriceHistory(): Promise<AdapterPricePoint[]> {
    return [];
  }
}

export const cheapSharkAdapter = new CheapSharkAdapter();

