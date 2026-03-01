import Link from "next/link";

import { DealCard } from "@/components/deals/deal-card";
import { CompactDealTableRow } from "@/components/deals/compact-deal-table-row";
import { SaveFilterButton } from "@/components/deals/save-filter-button";
import { Button } from "@/components/ui/button";
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
  hideExpired?: boolean;
  hideNoEndDate?: boolean;
  viewMode?: string;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);
  if (params.viewMode) query.set("viewMode", params.viewMode);
  query.set("page", String(params.page));
  if (typeof params.minDiscount === "number") query.set("minDiscount", String(params.minDiscount));
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.sourceType && params.sourceType !== "ALL") query.set("sourceType", params.sourceType);
  if (typeof params.minTrustScore === "number") query.set("minTrustScore", String(params.minTrustScore));
  if (params.hideExpired) query.set("hideExpired", "true");
  if (params.hideNoEndDate) query.set("hideNoEndDate", "true");
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
  const sortValue: DealFilters["sort"] = ["discount", "latest", "price_asc", "price_desc", "quality"].includes(sort)
    ? (sort as DealFilters["sort"])
    : "discount";
  const hideExpired = params.hideExpired === "true";
  const hideNoEndDate = params.hideNoEndDate === "true";
  const viewMode = typeof params.viewMode === "string" ? params.viewMode : "grid";

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
    hideExpired,
    hideNoEndDate,
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
        <h1 className="text-4xl font-extrabold text-white text-glow-cyan">Deals</h1>
        <p className="text-zinc-400 mt-2">Search, filter, and compare discounts by store and price.</p>
      </div>

      <section className="section-frame">
        <div className="p-0">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Input name="search" defaultValue={search} placeholder="Search games" className="sm:col-span-2 lg:col-span-2 border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-400" />
            <Input name="minDiscount" type="number" min={0} max={100} defaultValue={minDiscount} placeholder="Min %" className="border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-400" />
            <Input
              name="minTrustScore"
              type="number"
              min={0}
              max={100}
              defaultValue={minTrustScore}
              placeholder="Min trust"
              className="border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-400"
            />
            <Input name="minPrice" type="number" min={0} defaultValue={params.minPrice as string} placeholder="Min cents" className="border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-400" />
            <Input name="maxPrice" type="number" min={0} defaultValue={params.maxPrice as string} placeholder="Max cents" className="border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-400" />
            <select
              name="sort"
              defaultValue={sort}
              className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              <option value="discount">Top discount</option>
              <option value="quality">Deal Quality Score</option>
              <option value="latest">Trending</option>
              <option value="price_asc">Price low to high</option>
              <option value="price_desc">Price high to low</option>
            </select>
            <select
              name="sourceType"
              defaultValue={sourceType}
              className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All sources</option>
              <option value="OFFICIAL">Official stores</option>
              <option value="KEYSHOP">Keyshops</option>
            </select>

            <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap gap-4 items-center mb-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" name="hideExpired" value="true" defaultChecked={hideExpired} className="rounded border-white/20 bg-black/40 accent-cyan-400" />
                Hide expired
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" name="hideNoEndDate" value="true" defaultChecked={hideNoEndDate} className="rounded border-white/20 bg-black/40 accent-cyan-400" />
                Require end date
              </label>
            </div>

            <div className="sm:col-span-2 lg:col-span-6">
              <p className="mb-2 text-xs text-zinc-400 uppercase tracking-widest font-bold">Stores</p>
              <div className="flex flex-wrap gap-3">
                {availableStores.map((store) => {
                  const checked = stores.includes(store.slug);
                  return (
                    <label key={store.id} className="inline-flex items-center gap-2 text-sm text-zinc-300">
                      <input type="checkbox" name="store" value={store.slug} defaultChecked={checked} className="rounded border-white/20 bg-black/40 accent-cyan-400" />
                      {store.name}
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="sm:col-span-2 lg:col-span-6 flex items-center justify-between border-t border-white/5 pt-4 mt-2">
              <div className="flex gap-2">
                <Button type="submit" className="bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(59,232,255,0.4)] transition-all font-bold">
                  Apply filters
                </Button>
                <SaveFilterButton enabled={Boolean(session?.user?.id)} query={saveQuery} />
              </div>
              
              <div className="flex items-center gap-2 h-10 rounded-md border border-white/10 bg-black/40 p-1">
                <Button asChild variant="ghost" size="sm" className={`h-full px-3 ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  <Link scroll={false} href={buildDealsHref({ search, sort, page, stores, minDiscount, minPrice: params.minPrice as string, maxPrice: params.maxPrice as string, sourceType, minTrustScore, hideExpired, hideNoEndDate, viewMode: 'grid' })}>
                    Grid
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className={`h-full px-3 ${viewMode === 'compact' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  <Link scroll={false} href={buildDealsHref({ search, sort, page, stores, minDiscount, minPrice: params.minPrice as string, maxPrice: params.maxPrice as string, sourceType, minTrustScore, hideExpired, hideNoEndDate, viewMode: 'compact' })}>
                    List
                  </Link>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-full border-cyan-400/30 bg-cyan-950/20 text-cyan-100 hover:bg-cyan-400/30 hover:text-white">
          <Link href={buildDealsHref({ stores: [], page: 1, minTrustScore: 0, sort: 'discount', sourceType: 'ALL', minDiscount: 80 })}>80%+</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full border-cyan-400/30 bg-cyan-950/20 text-cyan-100 hover:bg-cyan-400/30 hover:text-white">
          <Link href={buildDealsHref({ stores: [], page: 1, minTrustScore: 0, sort: 'discount', sourceType: 'ALL', maxPrice: "1000" })}>Under $10</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full border-pink-400/30 bg-pink-950/20 text-pink-100 hover:bg-pink-400/30 hover:text-white">
          <Link href={buildDealsHref({ stores: [], page: 1, minTrustScore: 0, sort: 'discount', sourceType: 'ALL', maxPrice: "0" })}>Freebies</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full border-emerald-400/30 bg-emerald-950/20 text-emerald-100 hover:bg-emerald-400/30 hover:text-white">
          <Link href={buildDealsHref({ stores: [], page: 1, minTrustScore: 0, sort: 'discount', sourceType: 'OFFICIAL' })}>Official Stores Only</Link>
        </Button>
      </div>

      <div className={viewMode === 'grid' ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-2"}>
        {dealsData.items.map((deal) => (
          viewMode === 'grid' 
            ? <DealCard key={deal.id} deal={deal} />
            : <CompactDealTableRow key={deal.id} deal={deal} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between section-frame">
        <p className="text-sm text-zinc-400">
          Page {dealsData.page} of {dealsData.totalPages} ({dealsData.total} deals)
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={dealsData.page <= 1} className="border-white/10 bg-black/40 hover:bg-white/10 hover:text-white">
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
                viewMode,
                hideExpired,
                hideNoEndDate,
              })}
            >
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={dealsData.page >= dealsData.totalPages} className="border-white/10 bg-black/40 hover:bg-white/10 hover:text-white">
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
                viewMode,
                hideExpired,
                hideNoEndDate,
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
