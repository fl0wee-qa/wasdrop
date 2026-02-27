"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AdminConsoleProps = {
  curations: Array<{ id: string; type: string; title: string; description: string | null; itemsJson: unknown }>;
  sources: Array<{ id: string; name: string; feedUrl: string; category: string; isEnabled: boolean }>;
};

export function AdminConsole({ curations: initialCurations, sources: initialSources }: AdminConsoleProps) {
  const [status, setStatus] = useState<string>("");
  const [curations, setCurations] = useState(initialCurations);
  const [sources, setSources] = useState(initialSources);

  async function triggerJob(job: "deals" | "news") {
    setStatus(`Running ${job} sync...`);
    const response = await fetch(`/api/admin/jobs/${job}`, { method: "POST", body: "{}" });
    const payload = await response.json();
    setStatus(response.ok ? `${job} sync completed` : payload.error ?? "Failed");
  }

  async function createCuration(formData: FormData) {
    const payload = {
      type: String(formData.get("type") || "featured"),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      itemsJson: JSON.parse(String(formData.get("itemsJson") || "[]")),
    };

    const response = await fetch("/api/admin/curations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("Failed to create curation");
      return;
    }

    const data = (await response.json()) as { curation: AdminConsoleProps["curations"][number] };
    setCurations([data.curation, ...curations]);
    setStatus("Curation created");
  }

  async function createSource(formData: FormData) {
    const payload = {
      name: String(formData.get("name") || ""),
      feedUrl: String(formData.get("feedUrl") || ""),
      category: String(formData.get("category") || "industry"),
      isEnabled: true,
    };

    const response = await fetch("/api/admin/news-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("Failed to add source");
      return;
    }

    const data = (await response.json()) as { source: AdminConsoleProps["sources"][number] };
    setSources([data.source, ...sources]);
    setStatus("Source saved");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sync Jobs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => triggerJob("deals")}>Run Deals Sync</Button>
          <Button variant="secondary" onClick={() => triggerJob("news")}>Run News Sync</Button>
          <p className="w-full text-sm text-zinc-400">{status}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured Curations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="grid gap-3 md:grid-cols-2"
            action={(formData) => {
              void createCuration(formData);
            }}
          >
            <Input name="type" placeholder="featured|collection" required />
            <Input name="title" placeholder="Best RPG Deals This Week" required />
            <Input name="description" placeholder="Optional description" className="md:col-span-2" />
            <Textarea name="itemsJson" placeholder='[{"gameSlug":"cyberpunk-2077"}]' className="md:col-span-2" required />
            <Button type="submit" className="md:w-fit">Save curation</Button>
          </form>
          <div className="space-y-2 text-sm text-zinc-300">
            {curations.map((curation) => (
              <div key={curation.id} className="rounded-md border border-zinc-800 p-3">
                <p className="font-medium">{curation.title}</p>
                <p className="text-zinc-400">{curation.type}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>News Source Whitelist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="grid gap-3 md:grid-cols-2"
            action={(formData) => {
              void createSource(formData);
            }}
          >
            <Input name="name" placeholder="IGN" required />
            <Input name="category" placeholder="industry" required />
            <Input name="feedUrl" placeholder="https://...rss.xml" className="md:col-span-2" required />
            <Button type="submit" className="md:w-fit">Add source</Button>
          </form>
          <div className="space-y-2 text-sm text-zinc-300">
            {sources.map((source) => (
              <div key={source.id} className="rounded-md border border-zinc-800 p-3">
                <p className="font-medium">{source.name}</p>
                <p className="text-zinc-400">{source.feedUrl}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
