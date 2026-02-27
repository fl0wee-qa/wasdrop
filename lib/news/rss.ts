import Parser from "rss-parser";

export type ParsedNewsItem = {
  title: string;
  url: string;
  publishedAt: Date;
  contentSnippet?: string;
  imageUrl?: string;
};

const parser = new Parser();

function extractImage(item: Parser.Item) {
  const media = (item as Parser.Item & { "media:content"?: { $?: { url?: string } }[] })["media:content"];
  if (media?.[0]?.$?.url) {
    return media[0].$.url;
  }

  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  const content = (item as Parser.Item & { "content:encoded"?: string })["content:encoded"] ?? item.content;
  if (content) {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

export async function readFeed(feedUrl: string): Promise<ParsedNewsItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const items: ParsedNewsItem[] = [];

  for (const item of feed.items ?? []) {
    if (!item.link || !item.title) {
      continue;
    }

    const publishedAt = item.isoDate ?? item.pubDate;
    items.push({
      title: item.title,
      url: item.link,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      contentSnippet: item.contentSnippet ?? item.content?.slice(0, 240),
      imageUrl: extractImage(item),
    });
  }

  return items;
}
