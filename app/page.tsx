import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth";
import { formatMoney } from "@/lib/regions";
import { getFeaturedDeals, getFreebies, getTrendingDeals } from "@/lib/services/deals-service";
import { getLatestNews } from "@/lib/services/news-service";
import { resolveCountry } from "@/lib/services/user-preferences";

export const revalidate = 300;

function coverUrl(images: Array<{ url: string; type: string }>) {
  return images.find((image) => image.type === "cover")?.url ?? "/images/placeholder-game.svg";
}

function newsAgeLabel(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function HomePage() {
  const session = await getAuthSession();
  const country = await resolveCountry(session?.user?.id);

  const [featuredDeals, trendingDeals, freebies, latestNews] = await Promise.all([
    getFeaturedDeals(country, 8),
    getTrendingDeals(country, 8),
    getFreebies(country, 6),
    getLatestNews(3),
  ]);

  const heroDeal = featuredDeals[0] ?? trendingDeals[0] ?? freebies[0] ?? null;
  const topDiscounts = featuredDeals.slice(0, 4);
  const trendingList = trendingDeals.slice(0, 3);
  const freebiesList = freebies.slice(0, 2);
  const newsList = latestNews.slice(0, 3);
  const totalSavings = topDiscounts.reduce((sum, deal) => sum + Math.max(0, deal.originalPriceCents - deal.priceCents), 0);

  return (
    <div className="mx-auto max-w-7xl px-0 pb-16 md:pb-20">
      <section className="mb-16 flex flex-col items-center justify-between gap-8 text-center md:mb-20 md:flex-row md:gap-12 md:text-left">
        <div className="max-w-2xl">
          <h1 className="mb-5 text-5xl font-extrabold leading-none sm:text-6xl md:mb-6 md:text-8xl">
            WAS<span className="text-glow-cyan text-cyan-300">DROP</span>
          </h1>
          <p className="mb-6 text-base leading-relaxed text-slate-400 sm:text-xl md:mb-8">
            The ultimate aggregator for PC game discounts, verified freebies, and critical industry updates. Do not just
            play, play for less.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4 md:justify-start">
            <Button asChild className="w-full px-8 py-3 font-bold sm:w-auto">
              <Link href="/deals">Browse All Deals</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full px-8 py-3 font-semibold sm:w-auto">
              <Link href={session?.user ? "/account" : "/auth/sign-in"}>
                {session?.user ? "Open Account" : "Join Community"}
              </Link>
            </Button>
          </div>
        </div>

        {heroDeal ? (
          <div className="glass-panel w-full overflow-hidden p-2 md:w-[400px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={coverUrl(heroDeal.game.images)}
                alt={heroDeal.game.title}
                fill
                className="image-zoom object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f16] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="badge-discount mb-3 inline-block">TRENDING NOW</span>
                <h3 className="mb-2 text-2xl font-bold">{heroDeal.game.title}</h3>
                <p className="mb-4 text-sm text-slate-300">{heroDeal.store.name} live discount in {country}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-cyan-300">
                    {formatMoney(heroDeal.priceCents, heroDeal.country, heroDeal.currency)}
                  </span>
                  <Button asChild size="icon" variant="secondary" className="rounded-full">
                    <Link href={`/game/${heroDeal.game.slug}`}>+</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mb-16 md:mb-20">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-cyan-300" />
            <h2 className="text-3xl font-bold">Top Discounts</h2>
          </div>
          <Link href="/deals" className="text-sm font-semibold text-cyan-300 hover:underline">
            Browse all deals &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {topDiscounts.map((deal) => (
            <article key={deal.id} className="glass-panel group overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <Image src={coverUrl(deal.game.images)} alt={deal.game.title} fill className="image-zoom object-cover" />
                <div className="absolute right-4 top-4">
                  <span className="badge-discount">-{deal.discountPercent}%</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="mb-1 truncate text-lg font-bold">{deal.game.title}</h3>
                <p className="mb-4 text-sm text-slate-400">{deal.store.name}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 line-through">
                      {formatMoney(deal.originalPriceCents, deal.country, deal.currency)}
                    </span>
                    <span className="text-xl font-bold text-white">{formatMoney(deal.priceCents, deal.country, deal.currency)}</span>
                  </div>
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300 transition group-hover:bg-cyan-300 group-hover:text-black"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mb-16 grid grid-cols-1 gap-8 lg:mb-20 lg:gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-white/40" />
              <h2 className="text-3xl font-bold">Trending Now</h2>
            </div>
          </div>

          <div className="space-y-4">
            {trendingList.map((deal) => (
              <Link
                key={deal.id}
                href={`/game/${deal.game.slug}`}
                className="glass-panel group flex items-start gap-3 p-4 sm:items-center sm:gap-4"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={coverUrl(deal.game.images)}
                    alt={deal.game.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0"
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold">{deal.game.title}</h4>
                  <p className="text-xs text-slate-500">{deal.store.name}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-bold">{formatMoney(deal.priceCents, deal.country, deal.currency)}</div>
                  <div className="text-[10px] font-bold uppercase text-pink-500">-{deal.discountPercent}%</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-cyan-300" />
              <h2 className="text-3xl font-bold">Freebies</h2>
            </div>
            <Link href="/freebies" className="text-xs font-semibold text-cyan-300 hover:underline">
              See all &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {freebiesList.map((deal) => (
              <div key={deal.id} className="glass-panel group p-1">
                <div className="relative mb-3 h-40 overflow-hidden rounded-xl">
                  <Image src={coverUrl(deal.game.images)} alt={deal.game.title} fill className="image-zoom object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase text-black">FREE</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold">{deal.game.title}</h3>
                  <p className="mb-2 text-xs text-slate-500">{deal.store.name}</p>
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs font-bold uppercase tracking-widest transition hover:bg-cyan-300 hover:text-black"
                  >
                    Claim Now
                  </a>
                </div>
              </div>
            ))}
            {freebiesList.length === 0 ? <p className="text-sm text-slate-500">No freebies available in this region.</p> : null}
          </div>
        </div>
      </div>

      <section className="mb-16 md:mb-20">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-pink-500" />
            <h2 className="text-3xl font-bold">Gaming Industry News</h2>
          </div>
          <Link href="/news" className="text-sm font-semibold text-cyan-300 hover:underline">
            View all news &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {newsList.map((article) => (
            <article key={article.id} className="group cursor-pointer">
              <Link href={`/news/${article.slug}`}>
                <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-white/5">
                  {article.imageUrl ? (
                    <Image src={article.imageUrl} alt={article.title} fill className="image-zoom object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-900" />
                  )}
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-white">
                    {article.category}
                  </div>
                </div>
              </Link>
              <h3 className="mb-2 text-xl font-bold transition group-hover:text-cyan-300">{article.title}</h3>
              <p className="line-clamp-2 text-sm text-slate-400">{article.contentSnippet ?? "No snippet available."}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-white/10" />
                <span className="text-xs font-medium text-slate-500">
                  By {article.source.name} • {newsAgeLabel(article.publishedAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="glass-panel fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-8 border border-cyan-300/20 px-6 py-3 md:flex">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Live Updates Enabled</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
          Total Savings: <span className="text-cyan-300">{formatMoney(totalSavings, country)}</span>
        </div>
      </div>
    </div>
  );
}
