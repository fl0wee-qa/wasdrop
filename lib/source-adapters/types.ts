export type AdapterDeal = {
  externalGameId: string;
  title: string;
  description?: string | null;
  releaseDate?: Date | null;
  developer?: string | null;
  publisher?: string | null;
  imageUrl?: string | null;
  screenshots?: string[];
  genres?: string[];
  systemReqMin?: string | null;
  systemReqRec?: string | null;
  store: {
    name: string;
    slug: string;
  };
  country: string;
  currency: string;
  priceCents: number;
  originalPriceCents: number;
  discountPercent: number;
  url: string;
  startAt?: Date | null;
  endAt?: Date | null;
  isFreebie?: boolean;
  metadata?: Record<string, unknown>;
};

export type AdapterGameDetails = {
  externalGameId: string;
  title: string;
  description?: string | null;
  releaseDate?: Date | null;
  developer?: string | null;
  publisher?: string | null;
  coverUrl?: string | null;
  screenshots: string[];
  genres?: string[];
  systemReqMin?: string | null;
  systemReqRec?: string | null;
};

export type AdapterPricePoint = {
  date: Date;
  country: string;
  currency: string;
  priceCents: number;
  originalPriceCents: number;
  discountPercent: number;
};

export interface DealsSourceAdapter {
  name: string;
  getDeals(country: string): Promise<AdapterDeal[]>;
  getGameDetails(externalGameId: string, country: string): Promise<AdapterGameDetails | null>;
  getPriceHistory(externalGameId: string, country: string): Promise<AdapterPricePoint[]>;
}
