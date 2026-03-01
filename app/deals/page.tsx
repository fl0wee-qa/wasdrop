import Link from "next/link";

import { DealCard } from "@/components/deals/deal-card";
import { SaveFilterButton } from "@/components/deals/save-filter-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DealFilters } from "@/lib/services/deals-service";
import { getDeals } from "@/lib/services/deals-service";
import { resolveCountry } from "@/lib/services/user-preferences";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toNumber(value?: string) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildDealsHref(params: {
  search?: string;
  sort?: string;
  page: number;
  stores: string[];
  minDiscount?: number;
  minPrice?: string;
  maxPrice?: string;
  sourceType?: string;
  minTrustScore?: number;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);
  query.set("page", String(params.page));
  if (typeof params.minDiscount === "number") query.set("minDiscount", String(params.minDiscount));
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.sourceType && params.sourceType !== "ALL") query.set("sourceType", params.sourceType);
  if (typeof params.minTrustScore === "number") query.set("minTrustScore", String(params.minTrustScore));
  for (const store of params.stores) {
    query.append("store", store);
  }
  return `/deals?${query.toString()}`;
}

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getAuthSession();
  const country = await resolveCountry(session?.user?.id);

  const search = typeof params.search === "string" ? params.search : "";
  const stores =
    typeof params.store === "string"
      ? [params.store]
      : Array.isArray(params.store)
        ? params.store
        : typeof params.stores === "string"
          ? params.stores.split(",").filter(Boolean)
          : [];
  const sort = typeof params.sort === "string" ? params.sort : "discount";
  const page = toNumber(typeof params.page === "string" ? params.page : undefined) ?? 1;
  const minDiscount = toNumber(typeof params.minDiscount === "string" ? params.minDiscount : undefined);
  const minTrustScore = toNumber(typeof params.minTrustScore === "string" ? params.minTrustScore : undefined);
  const sourceTypeRaw = typeof params.sourceType === "string" ? params.sourceType : "ALL";
  const sourceType = ["ALL", "OFFICIAL", "KEYSHOP"].includes(sourceTypeRaw) ? sourceTypeRaw : "ALL";
  const sortValue: DealFilters["sort"] = ["discount", "latest", "price_asc", "price_desc"].includes(sort)
    ? (sort as DealFilters["sort"])
    : "discount";

  const dealsData = await getDeals({
    country,
    search,
    stores,
    sourceType: sourceType as DealFilters["sourceType"],
    sort: sortValue,
    page,
    minDiscount,
    minTrustScore,
    minPriceCents: toNumber(typeof params.minPrice === "string" ? params.minPrice : undefined),
    maxPriceCents: toNumber(typeof params.maxPrice === "string" ? params.maxPrice : undefined),
  });

  const availableStores = await prisma.store.findMany({ orderBy: { name: "asc" } });
  const saveQuery: Record<string, string | number | boolean | string[]> = {
    search,
    sort,
    page: 1,
    ...(stores.length ? { store: stores } : {}),
    ...(typeof minDiscount === "number" ? { minDiscount } : {}),
    ...(typeof minTrustScore === "number" ? { minTrustScore } : {}),
    ...(typeof params.minPrice === "string" ? { minPrice: params.minPrice } : {}),
    ...(typeof params.maxPrice === "string" ? { maxPrice: params.maxPrice } : {}),
    ...(sourceType !== "ALL" ? { sourceType } : {}),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-zinc-50">Deals</h1>
        <p className="text-zinc-400">Search, filter, and compare discounts by store and price.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Input name="search" defaultValue={search} placeholder="Search games" className="sm:col-span-2 lg:col-span-2" />
            <Input name="minDiscount" type="number" min={0} max={100} defaultValue={minDiscount} placeholder="Min %" />
            <Input
              name="minTrustScore"
              type="number"
              min={0}
              max={100}
              defaultValue={minTrustScore}
              placeholder="Min trust"
            />
            <Input name="minPrice" type="number" min={0} defaultValue={params.minPrice as string} placeholder="Min cents" />
            <Input name="maxPrice" type="number" min={0} defaultValue={params.maxPrice as string} placeholder="Max cents" />
            <select
              name="sort"
              defaultValue={sort}
              className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
            >
              <option value="discount">Top discount</option>
              <option value="latest">Trending</option>
              <option value="price_asc">Price low to high</option>
              <option value="price_desc">Price high to low</option>
            </select>
            <select
              name="sourceType"
              defaultValue={sourceType}
              className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
            >
              <option value="ALL">All sources</option>
              <option value="OFFICIAL">Official stores</option>
              <option value="KEYSHOP">Keyshops</option>
            </select>

            <div className="sm:col-span-2 lg:col-span-6">
              <p className="mb-2 text-xs text-zinc-400">Stores</p>
              <div className="flex flex-wrap gap-3">
                {availableStores.map((store) => {
                  const checked = stores.includes(store.slug);
                  return (
                    <label key={store.id} className="inline-flex items-center gap-2 text-sm text-zinc-300">
                      <input type="checkbox" name="store" value={store.slug} defaultChecked={checked} />
                      {store.name}
                    </label>
                  );
                })}
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-fit">
              Apply filters
            </Button>
            <SaveFilterButton enabled={Boolean(session?.user?.id)} query={saveQuery} />
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dealsData.items.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Page {dealsData.page} of {dealsData.totalPages} ({dealsData.total} deals)
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={dealsData.page <= 1}>
            <Link
              href={buildDealsHref({
                search,
                sort,
                page: Math.max(1, dealsData.page - 1),
                stores,
                minDiscount: minDiscount ?? undefined,
                minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
                maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
                sourceType,
                minTrustScore: minTrustScore ?? undefined,
              })}
            >
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={dealsData.page >= dealsData.totalPages}>
            <Link
              href={buildDealsHref({
                search,
                sort,
                page: Math.min(dealsData.totalPages, dealsData.page + 1),
                stores,
                minDiscount: minDiscount ?? undefined,
                minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
                maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
                sourceType,
                minTrustScore: minTrustScore ?? undefined,
              })}
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
