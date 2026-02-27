import Image from "next/image";
import Link from "next/link";

import { formatMoney } from "@/lib/regions";

type DealCardProps = {
  deal: {
    id: string;
    discountPercent: number;
    priceCents: number;
    originalPriceCents: number;
    country: string;
    currency: string;
    url: string;
    game: {
      id: string;
      title: string;
      slug: string;
      images: Array<{ url: string; type: string }>;
    };
    store: {
      name: string;
      slug: string;
    };
  };
};

export function DealCard({ deal }: DealCardProps) {
  const cover = deal.game.images.find((image) => image.type === "cover")?.url ?? "/images/placeholder-game.svg";

  return (
    <article className="glass-panel group overflow-hidden rounded-2xl">
      <Link href={`/game/${deal.game.slug}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <Image src={cover} alt={deal.game.title} fill className="image-zoom object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute right-3 top-3">
            <span className="badge-discount">-{deal.discountPercent}%</span>
          </div>
        </div>
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <Link href={`/game/${deal.game.slug}`} className="line-clamp-1 text-lg font-bold hover:text-cyan-300">
            {deal.game.title}
          </Link>
          <p className="text-xs text-slate-400">{deal.store.name}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 line-through">{formatMoney(deal.originalPriceCents, deal.country, deal.currency)}</p>
            <p className="text-xl font-extrabold">{formatMoney(deal.priceCents, deal.country, deal.currency)}</p>
          </div>
          <a
            href={deal.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-300 hover:text-black"
          >
            Store
          </a>
        </div>
      </div>
    </article>
  );
}
