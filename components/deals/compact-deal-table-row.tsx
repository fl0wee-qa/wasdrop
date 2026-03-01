import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/regions";

type CompactDealProps = {
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

export function CompactDealTableRow({ deal }: CompactDealProps) {
  const cover = deal.game.images.find((image) => image.type === "cover")?.url ?? "/images/placeholder-game.svg";

  return (
    <article className="glass-panel group overflow-hidden rounded-xl border border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_20px_-5px_var(--zone-1)] transition-all duration-300 flex items-center p-3 gap-4">
      <Link href={`/game/${deal.game.slug}`} className="shrink-0 flex items-center gap-3 w-[45%] min-w-0">
        <div className="relative h-14 w-14 overflow-hidden rounded-lg shrink-0 hidden sm:block">
          <Image src={cover} alt={deal.game.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" sizes="56px" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-base font-bold text-zinc-100 transition group-hover:text-cyan-300 group-hover:text-glow-cyan">
            {deal.game.title}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold">{deal.store.name}</span>
            <span className="rounded border border-zinc-700/50 bg-black/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-zinc-300 shadow-inner hidden sm:inline-block">
              {deal.sourceType === "OFFICIAL" ? "Official" : "Keyshop"}
            </span>
          </div>
        </div>
      </Link>
      
      <div className="flex flex-col items-end shrink-0 grow text-right">
        <span className="badge-discount shadow-[0_0_8px_var(--accent-pink)] text-[10px] px-1.5 py-0.5 mb-1 w-fit">-{deal.discountPercent}%</span>
      </div>

      <div className="shrink-0 text-right w-20 sm:w-24">
        <p className="text-[10px] text-slate-500 line-through">{formatMoney(deal.originalPriceCents, deal.country, deal.currency)}</p>
        <p className="text-base font-extrabold text-white">{formatMoney(deal.priceCents, deal.country, deal.currency)}</p>
      </div>
      
      <div className="shrink-0 hidden sm:block">
        <a
          href={deal.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-300 hover:text-black hover:shadow-[0_0_15px_rgba(59,232,255,0.4)] block text-center"
        >
          Store
        </a>
      </div>
    </article>
  );
}
