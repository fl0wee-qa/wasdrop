import Image from "next/image";
import Link from "next/link";

export function NewsCard({
  article,
}: {
  article: {
    slug: string;
    title: string;
    imageUrl: string | null;
    category: string;
    source: { name: string };
    contentSnippet: string | null;
  };
}) {
  return (
    <article className="glass-panel group cursor-pointer rounded-2xl p-4 transition-all hover:bg-white/5 hover:border-cyan-500/30 flex flex-col h-full">
      <Link href={`/news/${article.slug}`} className="block flex-1">
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl border border-white/5 bg-black/40">
          {article.imageUrl ? (
            <Image src={article.imageUrl} alt={article.title} fill className="image-zoom object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700">No Image</div>
          )}
          <div className="absolute left-3 top-3 rounded-full border border-pink-500/30 bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-pink-300 shadow-md backdrop-blur-md">
            {article.category}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            {article.source.name}
          </span>
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-white transition group-hover:text-cyan-300">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
          {article.contentSnippet ?? "No preview available."}
        </p>
      </Link>
    </article>
  );
}
