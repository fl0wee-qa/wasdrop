import Link from "next/link";

import { NewsCard } from "@/components/news/news-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getNewsPage } from "@/lib/services/news-service";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sourceId = typeof params.source === "string" ? params.source : "";

  const [news, sources] = await Promise.all([
    getNewsPage({ page, search, category: category || undefined, sourceId: sourceId || undefined }),
    prisma.newsSource.findMany({ where: { isEnabled: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  const categories = ["release", "hardware", "announcement", "interview", "review"];

  return (
    <div className="space-y-8">
      <div className="hero-shell rounded-2xl p-6 md:p-8 text-center border border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
        <h1 className="mb-4 text-4xl md:text-5xl font-black text-white text-glow-cyan tracking-tight">Gaming Industry News</h1>
        <p className="text-zinc-300 max-w-2xl mx-auto text-lg">Delays, launches, acquisitions, milestones, and hardware updates for players.</p>
      </div>

      <div className="section-frame p-6">
        <form className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <Input name="search" defaultValue={search} placeholder="Search news articles..." className="flex-1 bg-black/40 border-white/10 text-white min-w-[250px]" />
            <Button type="submit" className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold px-6">
              Search
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Select Category</h3>
              <div className="flex flex-wrap gap-2">
                <Link href={`/news?search=${search}&source=${sourceId}`}>
                  <span className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer ${!category ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'}`}>
                    All Categories
                  </span>
                </Link>
                {categories.map((cat) => (
                  <Link key={cat} href={`/news?search=${search}&category=${cat}&source=${sourceId}`}>
                    <span className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer capitalize ${category === cat ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'}`}>
                      {cat}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Select Source</h3>
              <div className="flex flex-wrap gap-2">
                <Link href={`/news?search=${search}&category=${category}`}>
                  <span className={`px-3 py-1 rounded border text-xs font-semibold transition-colors cursor-pointer ${!sourceId ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/30 hover:text-white'}`}>
                    All Sources
                  </span>
                </Link>
                {sources.map((src) => (
                  <Link key={src.id} href={`/news?search=${search}&category=${category}&source=${src.id}`}>
                    <span className={`px-3 py-1 rounded border text-xs font-semibold transition-colors cursor-pointer ${sourceId === src.id ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300' : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/30 hover:text-white'}`}>
                      {src.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>

      {news.items.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl">
          <p className="text-xl text-zinc-400 font-medium">No articles found matching filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.items.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {news.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 glass-panel rounded-xl">
          <p className="text-sm font-medium text-cyan-300">
            Page {news.page} of {news.totalPages} <span className="text-zinc-500">|</span> <span className="text-zinc-400">{news.total} articles</span>
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={news.page <= 1} className="border-white/10 text-white bg-black/50 hover:bg-white/10">
              <Link href={`/news?search=${encodeURIComponent(search)}&category=${category}&source=${sourceId}&page=${Math.max(1, news.page - 1)}`}>
                Previous Return
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={news.page >= news.totalPages} className="border-white/10 text-white bg-black/50 hover:bg-white/10">
              <Link
                href={`/news?search=${encodeURIComponent(search)}&category=${category}&source=${sourceId}&page=${Math.min(
                  news.totalPages,
                  news.page + 1,
                )}`}
              >
                Next Jump
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
