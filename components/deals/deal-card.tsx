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
    sourceType: "OFFICIAL" | "KEYSHOP";
    trustScore: number;
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
    <article className="glass-panel group overflow-hidden rounded-2xl border border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_30px_-5px_var(--zone-1)] transition-all duration-300">
      <Link href={`/game/${deal.game.slug}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <Image src={cover} alt={deal.game.title} fill className="image-zoom object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute right-3 top-3">
            <span className="badge-discount shadow-[0_0_12px_var(--accent-pink)]">-{deal.discountPercent}%</span>
          </div>
        </div>
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <Link href={`/game/${deal.game.slug}`} className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-cyan-300 group-hover:text-glow-cyan text-white">
            {deal.game.title}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold">{deal.store.name}</span>
            <span className="rounded border border-zinc-700/50 bg-black/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300 shadow-inner">
              {deal.sourceType === "OFFICIAL" ? "Official" : "Keyshop"}
            </span>
            <span className="rounded border border-cyan-400/30 bg-cyan-950/30 px-1.5 py-0.5 text-[10px] text-cyan-300 shadow-[0_0_8px_rgba(59,232,255,0.1)]">
              Trust {deal.trustScore}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs text-slate-500 line-through">{formatMoney(deal.originalPriceCents, deal.country, deal.currency)}</p>
            <p className="text-xl font-extrabold text-white">{formatMoney(deal.priceCents, deal.country, deal.currency)}</p>
          </div>
          <a
            href={deal.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-300 hover:text-black hover:shadow-[0_0_15px_rgba(59,232,255,0.4)]"
          >
            Store
          </a>
        </div>
      </div>
    </article>
  );
}
