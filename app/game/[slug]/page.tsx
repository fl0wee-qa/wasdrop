import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DealCard } from "@/components/deals/deal-card";
import { GameActions } from "@/components/deals/game-actions";
import { PriceHistoryChart } from "@/components/deals/price-history-chart";
import { getAuthSession } from "@/lib/auth";
import { formatMoney } from "@/lib/regions";
import { getGameBySlug, recordUserActivity } from "@/lib/services/deals-service";
import { resolveCountry } from "@/lib/services/user-preferences";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const details = await getGameBySlug(slug, "US");

  if (!details) {
    return { title: "Game not found" };
  }

  const cover = details.game.images.find((image) => image.type === "cover")?.url;

  return {
    title: details.game.title,
    description: details.game.description ?? `Latest prices and discounts for ${details.game.title}.`,
    openGraph: {
      title: details.game.title,
      description: details.game.description ?? `Latest prices and discounts for ${details.game.title}.`,
      images: cover ? [cover] : [],
      type: "website",
    },
  };
}

export default async function GameDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getAuthSession();
  const country = await resolveCountry(session?.user?.id);

  const details = await getGameBySlug(slug, country);
  if (!details) {
    notFound();
  }

  if (session?.user?.id) {
    await recordUserActivity({
      userId: session.user.id,
      type: "VIEW_GAME",
      gameId: details.game.id,
    });
  }

  const bestDeal = details.game.deals[0];
  const cover = details.game.images.find((image) => image.type === "cover")?.url ?? "/images/placeholder-game.svg";
  const screenshots = details.game.images.filter((image) => image.type === "screenshot").map((image) => image.url);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSnapshots = details.game.snapshots.filter((snapshot) => snapshot.date >= thirtyDaysAgo);
  const lowest30DayPrice = recentSnapshots.length > 0 ? Math.min(...recentSnapshots.map((snapshot) => snapshot.priceCents)) : Infinity;
  const lowest90DayPrice =
    details.game.snapshots.length > 0 ? Math.min(...details.game.snapshots.map((snapshot) => snapshot.priceCents)) : Infinity;
  const is30DayLow = Boolean(bestDeal && bestDeal.priceCents > 0 && bestDeal.priceCents <= lowest30DayPrice);
  const is90DayLow = Boolean(bestDeal && bestDeal.priceCents > 0 && bestDeal.priceCents <= lowest90DayPrice);

  return (
    <div className="space-y-7">
      <section className="section-frame">
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white text-glow-cyan md:text-5xl">{details.game.title}</h1>
            <div className="relative aspect-[16/8] overflow-hidden rounded-xl border border-white/10">
              <Image src={cover} alt={details.game.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 68vw" />
            </div>
            {screenshots.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {screenshots.slice(0, 6).map((image, index) => (
                  <div key={image} className="relative aspect-video overflow-hidden rounded-md border border-white/10">
                    <Image src={image} alt={`${details.game.title} screenshot ${index + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="glass-panel p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Best Current Offer</p>
              {bestDeal ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-400">{bestDeal.store.name}</p>
                      <p className="text-3xl font-black text-white">
                        {formatMoney(bestDeal.priceCents, country, bestDeal.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge-discount inline-block">-{bestDeal.discountPercent}%</span>
                      <p className="mt-1 text-xs text-zinc-500 line-through">
                        {formatMoney(bestDeal.originalPriceCents, country, bestDeal.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {is90DayLow ? (
                      <span className="rounded border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                        90-day low
                      </span>
                    ) : null}
                    {!is90DayLow && is30DayLow ? (
                      <span className="rounded border border-cyan-500/40 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-300">
                        30-day low
                      </span>
                    ) : null}
                    <span className="rounded border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      Updated {formatDistanceToNow(bestDeal.lastSeenAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">No active deals in this region.</p>
              )}
            </div>

            <GameActions gameId={details.game.id} country={country} currency={bestDeal?.currency ?? "USD"} signedIn={Boolean(session?.user)} />

            <div className="glass-panel p-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Store Comparison</h3>
              <div className="mt-3 space-y-2">
                {details.game.deals.map((deal) => (
                  <a
                    key={deal.id}
                    href={deal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/30 px-3 py-2 text-sm hover:border-cyan-400/30 hover:bg-black/45"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{deal.store.name}</p>
                      <p className="text-xs text-zinc-400">
                        {deal.sourceType === "KEYSHOP" ? "Keyshop" : "Official"} | Trust {deal.trustScore}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white">{formatMoney(deal.priceCents, country, deal.currency)}</p>
                      <p className="text-[10px] uppercase text-pink-400">-{deal.discountPercent}%</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="section-frame">
          <h2 className="mb-3 text-xl font-black text-white">About</h2>
          <div
            className="space-y-2 text-sm leading-relaxed text-zinc-300"
            dangerouslySetInnerHTML={{ __html: details.game.description ?? "No description available." }}
          />
        </div>
        <div className="section-frame">
          <h2 className="mb-3 text-xl font-black text-white">System Requirements</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border border-white/10 bg-black/30 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">Minimum</p>
              <div className="space-y-1 text-sm text-zinc-300" dangerouslySetInnerHTML={{ __html: details.game.systemReqMin ?? "Not available" }} />
            </div>
            <div className="rounded border border-white/10 bg-black/30 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-300">Recommended</p>
              <div className="space-y-1 text-sm text-zinc-300" dangerouslySetInnerHTML={{ __html: details.game.systemReqRec ?? "Not available" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-frame">
        <h2 className="mb-3 text-2xl font-black text-white">Price History (90 days)</h2>
        <PriceHistoryChart
          country={country}
          points={details.game.snapshots.map((snapshot) => ({
            date: snapshot.date.toISOString().slice(0, 10),
            priceCents: snapshot.priceCents,
            originalPriceCents: snapshot.originalPriceCents,
            country: snapshot.country,
            currency: snapshot.currency,
          }))}
        />
      </section>

      <section className="section-frame">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-2xl font-black text-white">Similar Games</h2>
          <Link href="/deals" className="text-sm font-semibold text-cyan-300 hover:underline">
            Explore all deals
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.similarGames.map((similarGame) => {
            const deal = similarGame.deals[0];
            if (!deal) {
              return null;
            }

            return (
              <DealCard
                key={similarGame.id}
                deal={{
                  ...deal,
                  game: {
                    id: similarGame.id,
                    slug: similarGame.slug,
                    title: similarGame.title,
                    images: similarGame.images,
                  },
                }}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
