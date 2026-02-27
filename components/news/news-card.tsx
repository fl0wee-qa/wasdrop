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
    <article className="group cursor-pointer">
      <Link href={`/news/${article.slug}`}>
        <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-white/10">
          {article.imageUrl ? (
            <Image src={article.imageUrl} alt={article.title} fill className="image-zoom object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
          ) : null}
          <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            {article.category}
          </div>
        </div>
      </Link>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{article.source.name}</p>
      <Link href={`/news/${article.slug}`} className="mt-1 line-clamp-2 block text-lg font-bold transition group-hover:text-cyan-300">
        {article.title}
      </Link>
      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{article.contentSnippet ?? "No preview available."}</p>
    </article>
  );
}
