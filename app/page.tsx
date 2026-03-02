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
    getFeaturedDeals(country, 9),
    getTrendingDeals(country, 8),
    getFreebies(country, 6),
    getLatestNews(3),
  ]);

  const heroDeal = featuredDeals[0] ?? trendingDeals[0] ?? freebies[0] ?? null;
  const heroGrid = featuredDeals.slice(1, 5);
  const trendingList = trendingDeals.slice(0, 4);
  const freebiesList = freebies.slice(0, 3);
  const newsList = latestNews.slice(0, 3);
  const totalSavings = featuredDeals.reduce((sum, deal) => sum + Math.max(0, deal.originalPriceCents - deal.priceCents), 0);

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="hero-shell surface-card relative overflow-hidden border border-white/10 p-5 md:p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          <span className="zone-badge">Terraria</span>
          <span className="zone-badge">Cyberpunk</span>
          <span className="zone-badge">Shooter</span>
          <span className="zone-badge">Adventure</span>
          <span className="zone-badge">Mythic</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            <h1 className="hero-title text-white">
              WASDrop
              <span className="block text-cyan-300 text-glow-cyan">Find Better Deals Faster</span>
            </h1>
            <p className="max-w-2xl text-base text-slate-300 md:text-lg">
              One feed for major PC stores, region-aware pricing, freebies, and gamer-focused news. Built to hunt deals,
              not noise.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-cyan-400 px-6 font-black text-black hover:bg-cyan-300">
                <Link href="/deals">Browse Deals</Link>
              </Button>
              <Button asChild variant="secondary" className="px-6 font-semibold">
                <Link href={session?.user ? "/account" : "/auth/sign-in"}>
                  {session?.user ? "Open Account" : "Sign In"}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-black/40 px-6 text-white hover:bg-white/10">
                <Link href="/news">Read News</Link>
              </Button>
            </div>
            <div className="hud-strip inline-flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live updates enabled
              <span className="text-zinc-500">|</span>
              Savings tracked: <span className="text-cyan-300">{formatMoney(totalSavings, country)}</span>
            </div>
          </div>

          {heroDeal ? (
            <article className="glass-panel relative overflow-hidden p-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                <Image src={coverUrl(heroDeal.game.images)} alt={heroDeal.game.title} fill className="image-zoom object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-300">Featured Deal</p>
                  <h2 className="line-clamp-2 text-2xl font-black text-white">{heroDeal.game.title}</h2>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-400">{heroDeal.store.name}</p>
                      <p className="text-2xl font-black text-white">
                        {formatMoney(heroDeal.priceCents, heroDeal.country, heroDeal.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge-discount inline-block">-{heroDeal.discountPercent}%</span>
                      <p className="mt-1 text-xs text-zinc-500 line-through">
                        {formatMoney(heroDeal.originalPriceCents, heroDeal.country, heroDeal.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="section-frame">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-white md:text-3xl">Top Discounts</h2>
          <Link href="/deals" className="text-sm font-semibold text-cyan-300 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroGrid.map((deal) => (
            <article key={deal.id} className="glass-panel group overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                <Image src={coverUrl(deal.game.images)} alt={deal.game.title} fill className="image-zoom object-cover" />
                <div className="absolute right-3 top-3">
                  <span className="badge-discount">-{deal.discountPercent}%</span>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <h3 className="line-clamp-1 text-lg font-bold text-white">{deal.game.title}</h3>
                <p className="text-xs uppercase tracking-wide text-zinc-400">{deal.store.name}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 line-through">
                      {formatMoney(deal.originalPriceCents, deal.country, deal.currency)}
                    </p>
                    <p className="text-xl font-black text-white">{formatMoney(deal.priceCents, deal.country, deal.currency)}</p>
                  </div>
                  <Link href={`/game/${deal.game.slug}`} className="text-xs font-semibold text-cyan-300 hover:underline">
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="section-frame lg:col-span-2">
          <h2 className="mb-4 text-2xl font-black text-white md:text-3xl">Trending Right Now</h2>
          <div className="space-y-3">
            {trendingList.map((deal) => (
              <Link key={deal.id} href={`/game/${deal.game.slug}`} className="glass-panel group flex items-center gap-3 p-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-md">
                  <Image src={coverUrl(deal.game.images)} alt={deal.game.title} fill className="image-zoom object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white group-hover:text-cyan-300">{deal.game.title}</p>
                  <p className="text-xs text-zinc-400">{deal.store.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">{formatMoney(deal.priceCents, deal.country, deal.currency)}</p>
                  <p className="text-[10px] font-bold uppercase text-pink-400">-{deal.discountPercent}%</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section-frame">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">Freebies</h2>
            <Link href="/freebies" className="text-xs font-semibold text-cyan-300 hover:underline">
              Open list
            </Link>
          </div>
          <div className="space-y-3">
            {freebiesList.map((deal) => (
              <article key={deal.id} className="glass-panel overflow-hidden p-2">
                <div className="relative mb-2 h-28 overflow-hidden rounded-lg">
                  <Image src={coverUrl(deal.game.images)} alt={deal.game.title} fill className="image-zoom object-cover" />
                  <div className="absolute left-2 top-2 rounded bg-white px-2 py-1 text-[10px] font-black uppercase text-black">Free</div>
                </div>
                <h3 className="line-clamp-1 font-bold text-white">{deal.game.title}</h3>
                <p className="text-xs text-zinc-400">{deal.store.name}</p>
              </article>
            ))}
            {freebiesList.length === 0 ? <p className="text-sm text-zinc-400">No freebies for the selected region.</p> : null}
          </div>
        </section>
      </div>

      <section className="section-frame">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-white md:text-3xl">Gaming Industry News</h2>
          <Link href="/news" className="text-sm font-semibold text-cyan-300 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {newsList.map((article) => (
            <article key={article.id} className="glass-panel group overflow-hidden p-3">
              <Link href={`/news/${article.slug}`}>
                <div className="relative mb-3 aspect-video overflow-hidden rounded-lg">
                  {article.imageUrl ? (
                    <Image src={article.imageUrl} alt={article.title} fill className="image-zoom object-cover" />
                  ) : (
                    <div className="h-full w-full bg-black/40" />
                  )}
                  <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                    {article.category}
                  </div>
                </div>
                <h3 className="line-clamp-2 text-lg font-bold text-white group-hover:text-cyan-300">{article.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{article.contentSnippet ?? "No snippet available."}</p>
                <p className="mt-3 text-xs text-zinc-500">
                  {article.source.name} | {newsAgeLabel(article.publishedAt)}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
