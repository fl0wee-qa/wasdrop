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
    <article className="glass-panel group flex h-full cursor-pointer flex-col rounded-2xl p-3 transition-all hover:border-cyan-500/30">
      <Link href={`/news/${article.slug}`} className="block flex-1">
        <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="image-zoom object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700">No Image</div>
          )}
          <div className="absolute left-3 top-3 rounded-md border border-pink-500/30 bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-pink-300 shadow-md backdrop-blur-md">
            {article.category}
          </div>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            {article.source.name}
          </span>
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-white transition group-hover:text-cyan-300">{article.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{article.contentSnippet ?? "No preview available."}</p>
      </Link>
    </article>
  );
}
