import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { getArticleBySlug, recordNewsView } from "@/lib/services/news-service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "News not found" };
  }

  return {
    title: article.title,
    description: article.contentSnippet ?? `Gaming industry news from ${article.source.name}.`,
    openGraph: {
      title: article.title,
      description: article.contentSnippet ?? `Gaming industry news from ${article.source.name}.`,
      images: article.imageUrl ? [article.imageUrl] : [],
      type: "article",
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const session = await getAuthSession();

  if (!article) {
    notFound();
  }

  if (session?.user?.id) {
    await recordNewsView(session.user.id, article.id);
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge>{article.category}</Badge>
          <span className="text-sm text-zinc-400">{article.source.name}</span>
        </div>
        <h1 className="text-4xl text-zinc-50">{article.title}</h1>
        <p className="text-zinc-400">Published {article.publishedAt.toLocaleString()}</p>
      </header>

      <Card>
        <CardContent className="space-y-4 p-6 text-zinc-300">
          <p>{article.contentSnippet ?? "No excerpt available."}</p>
          {article.aiSummary ? (
            <div className="rounded-md border border-zinc-700 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-400">AI Summary</p>
              <p className="mt-2">{article.aiSummary}</p>
              <p className="mt-2 text-xs text-zinc-500">
                This summary is generated and not original reporting. Read the source article for full context.
              </p>
            </div>
          ) : null}
          <a href={article.url} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300">
            Read original article at {article.source.name}
          </a>
        </CardContent>
      </Card>
    </article>
  );
}
