import Link from "next/link";

import { NewsCard } from "@/components/news/news-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getNewsPage } from "@/lib/services/news-service";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";

  const news = await getNewsPage({ page, search, category: category || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-zinc-50">Gaming Industry News</h1>
        <p className="text-zinc-400">Delays, launches, acquisitions, milestones, and hardware updates for players.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="search" defaultValue={search} placeholder="Search news" className="sm:col-span-2 lg:col-span-2" />
            <Input name="category" defaultValue={category} placeholder="Category (e.g. release)" />
            <Button type="submit" className="w-full sm:w-fit">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {news.items.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Page {news.page} of {news.totalPages} ({news.total} articles)
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={news.page <= 1}>
            <Link href={`/news?search=${encodeURIComponent(search)}&category=${category}&page=${Math.max(1, news.page - 1)}`}>
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={news.page >= news.totalPages}>
            <Link
              href={`/news?search=${encodeURIComponent(search)}&category=${category}&page=${Math.min(
                news.totalPages,
                news.page + 1,
              )}`}
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
