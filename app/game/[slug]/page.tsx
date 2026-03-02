import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { DealCard } from "@/components/deals/deal-card";
import { GameActions } from "@/components/deals/game-actions";
import { PriceHistoryChart } from "@/components/deals/price-history-chart";
import { formatDistanceToNow } from "date-fns";
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
  
  const recentSnapshots = details.game.snapshots.filter(s => s.date >= thirtyDaysAgo);
  const lowest30DayPrice = recentSnapshots.length > 0 ? Math.min(...recentSnapshots.map(s => s.priceCents)) : Infinity;
  const lowest90DayPrice = details.game.snapshots.length > 0 ? Math.min(...details.game.snapshots.map(s => s.priceCents)) : Infinity;

  const is30DayLow = bestDeal && bestDeal.priceCents > 0 && bestDeal.priceCents <= lowest30DayPrice;
  const is90DayLow = bestDeal && bestDeal.priceCents > 0 && bestDeal.priceCents <= lowest90DayPrice;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-white text-glow-cyan">{details.game.title}</h1>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Image src={cover} alt={details.game.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 70vw" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {screenshots.slice(0, 6).map((image, index) => (
              <div key={image} className="relative aspect-video overflow-hidden rounded-lg border border-white/5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                <Image src={image} alt={`${details.game.title} screenshot ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
          <div className="section-frame p-6">
            <h2 className="text-xl font-bold text-white mb-3">About this game</h2>
            <div className="text-zinc-300 leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: details.game.description ?? "No description available." }} />
          </div>
        </div>

        <div className="space-y-6">
          <section className="hero-shell rounded-2xl p-6 border border-cyan-500/30">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-glow-cyan">Best Current Offer</span>
            </h2>
            <div className="space-y-4">
              {bestDeal ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-cyan-400 mb-1">{bestDeal.store.name}</p>
                      <p className="text-4xl font-black text-white drop-shadow-md">
                        {formatMoney(bestDeal.priceCents, country, bestDeal.currency)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="badge-discount shadow-[0_0_15px_var(--accent-pink)] text-[14px] px-3 py-1">
                        -{bestDeal.discountPercent}%
                      </span>
                      <span className="text-sm text-zinc-400 line-through">
                        {formatMoney(bestDeal.originalPriceCents, country, bestDeal.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 mt-2">
                    {is90DayLow ? (
                      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">🔥 Historical 90-Day Low</span>
                    ) : is30DayLow ? (
                      <span className="rounded-md border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">✨ 30-Day Low</span>
                    ) : null}
                    <span className="rounded-md border border-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-400">
                      Changed {formatDistanceToNow(bestDeal.lastSeenAt, { addSuffix: true })}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400">No active deals in this region.</p>
              )}
              <GameActions
                gameId={details.game.id}
                country={country}
                currency={bestDeal?.currency ?? "USD"}
                signedIn={Boolean(session?.user)}
              />
            </div>
          </section>

          <section className="glass-panel p-5 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-3 tracking-wide">Compare Stores</h3>
            <div className="space-y-2">
              {details.game.deals.map((deal) => (
                <a
                  key={deal.id}
                  href={deal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 px-4 py-3 text-sm text-zinc-200 transition-all hover:bg-white/5 hover:border-cyan-500/30 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold group-hover:text-cyan-300 transition-colors">{deal.store.name}</span>
                    {deal.sourceType === "KEYSHOP" && (
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">Keyshop</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-discount text-[10px] px-1.5 py-0.5 w-fit">-{deal.discountPercent}%</span>
                    <span className="font-bold w-16 text-right block">{formatMoney(deal.priceCents, country, deal.currency)}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="glass-panel p-5 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-3 tracking-wide">System Requirements</h3>
            <div className="space-y-4 text-sm text-zinc-300">
              <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                <p className="font-bold text-cyan-400 mb-2 uppercase text-xs tracking-wider">Minimum</p>
                <div className="space-y-1 opacity-90" dangerouslySetInnerHTML={{ __html: details.game.systemReqMin ?? "Not available" }} />
              </div>
              <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                <p className="font-bold text-pink-400 mb-2 uppercase text-xs tracking-wider">Recommended</p>
                <div className="space-y-1 opacity-90" dangerouslySetInnerHTML={{ __html: details.game.systemReqRec ?? "Not available" }} />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Price History (90 Days)</h2>
        <div className="section-frame p-6">
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
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Similar Games</h2>
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
        <Link href="/deals" className="text-sm text-orange-400 hover:text-orange-300">
          Explore more deals
        </Link>
      </section>
    </div>
  );
}
