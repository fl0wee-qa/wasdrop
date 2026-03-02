import Link from "next/link";

import { NewsCard } from "@/components/news/news-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { getNewsPage } from "@/lib/services/news-service";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function withParams(search: string, category: string, sourceId: string, page?: number) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (category) query.set("category", category);
  if (sourceId) query.set("source", sourceId);
  if (page) query.set("page", String(page));
  const encoded = query.toString();
  return encoded ? `/news?${encoded}` : "/news";
}

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sourceId = typeof params.source === "string" ? params.source : "";

  const [news, sources] = await Promise.all([
    getNewsPage({ page, search, category: category || undefined, sourceId: sourceId || undefined }),
    prisma.newsSource.findMany({ where: { isEnabled: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const categories = ["release", "hardware", "announcement", "business", "acquisition", "review"];

  return (
    <div className="space-y-7">
      <section className="hero-shell section-frame">
        <h1 className="text-4xl font-black text-white text-glow-cyan md:text-5xl">Gaming Industry News</h1>
        <p className="mt-3 max-w-3xl text-base text-zinc-300 md:text-lg">
          Curated updates around launches, delays, major business events, hardware, and player-facing news.
        </p>
      </section>

      <section className="section-frame space-y-5">
        <form className="flex flex-col gap-3 md:flex-row" action="/news">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search by title, source, category..."
            className="border-white/10 bg-black/35 text-white placeholder:text-zinc-500"
          />
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {sourceId ? <input type="hidden" name="source" value={sourceId} /> : null}
          <Button type="submit" className="bg-cyan-400 font-black text-black hover:bg-cyan-300">
            Search
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Categories</p>
          <div className="flex flex-wrap gap-2">
            <Link href={withParams(search, "", sourceId)}>
              <span className={`zone-badge ${category ? "" : "border-cyan-400/60 text-cyan-300"}`}>All</span>
            </Link>
            {categories.map((cat) => (
              <Link key={cat} href={withParams(search, cat, sourceId)}>
                <span className={`zone-badge ${category === cat ? "border-pink-400/70 text-pink-300" : ""}`}>{cat}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Sources</p>
          <div className="flex flex-wrap gap-2">
            <Link href={withParams(search, category, "")}>
              <span className={`zone-badge ${sourceId ? "" : "border-emerald-400/70 text-emerald-300"}`}>All sources</span>
            </Link>
            {sources.map((source) => (
              <Link key={source.id} href={withParams(search, category, source.id)}>
                <span className={`zone-badge ${sourceId === source.id ? "border-cyan-400/70 text-cyan-300" : ""}`}>{source.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {news.items.length === 0 ? (
        <section className="section-frame p-10 text-center">
          <p className="text-lg text-zinc-400">No articles found for selected filters.</p>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {news.items.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </section>
      )}

      {news.totalPages > 1 ? (
        <section className="section-frame flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-400">
            Page <span className="font-bold text-cyan-300">{news.page}</span> of {news.totalPages} ({news.total} articles)
          </p>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={news.page <= 1}
              className="border-white/10 bg-black/35 text-white hover:bg-white/10"
            >
              <Link href={withParams(search, category, sourceId, Math.max(1, news.page - 1))}>Previous</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={news.page >= news.totalPages}
              className="border-white/10 bg-black/35 text-white hover:bg-white/10"
            >
              <Link href={withParams(search, category, sourceId, Math.min(news.totalPages, news.page + 1))}>Next</Link>
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
