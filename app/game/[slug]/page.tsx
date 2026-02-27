import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { DealCard } from "@/components/deals/deal-card";
import { GameActions } from "@/components/deals/game-actions";
import { PriceHistoryChart } from "@/components/deals/price-history-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <h1 className="text-4xl text-zinc-50">{details.game.title}</h1>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800">
            <Image src={cover} alt={details.game.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 70vw" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {screenshots.slice(0, 6).map((image, index) => (
              <div key={image} className="relative aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800">
                <Image src={image} alt={`${details.game.title} screenshot ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
          <p className="text-zinc-300" dangerouslySetInnerHTML={{ __html: details.game.description ?? "No description available." }} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bestDeal ? (
                <>
                  <p className="text-2xl font-semibold text-zinc-100">
                    {formatMoney(bestDeal.priceCents, country, bestDeal.currency)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="line-through">
                      {formatMoney(bestDeal.originalPriceCents, country, bestDeal.currency)}
                    </span>
                    <Badge className="border-orange-500/30 bg-orange-500/20 text-orange-300">
                      -{bestDeal.discountPercent}%
                    </Badge>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {details.game.deals.map((deal) => (
                <a
                  key={deal.id}
                  href={deal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-600"
                >
                  <span>{deal.store.name}</span>
                  <span>{formatMoney(deal.priceCents, country, deal.currency)}</span>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <div>
                <p className="font-semibold text-zinc-100">Minimum</p>
                <p dangerouslySetInnerHTML={{ __html: details.game.systemReqMin ?? "Not available" }} />
              </div>
              <div>
                <p className="font-semibold text-zinc-100">Recommended</p>
                <p dangerouslySetInnerHTML={{ __html: details.game.systemReqRec ?? "Not available" }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl text-zinc-50">Price History (90 Days)</h2>
        <Card>
          <CardContent className="p-5">
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
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl text-zinc-50">Similar Games</h2>
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
