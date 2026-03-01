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
  const [selectedCurations, setSelectedCurations] = useState<Set<string>>(new Set());

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

  async function deleteSelectedCurations() {
    if (selectedCurations.size === 0) return;
    
    setStatus("Deleting curations...");
    const ids = Array.from(selectedCurations);
    const response = await fetch("/api/admin/curations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      setStatus("Failed to delete curations");
      return;
    }

    setCurations(curations.filter(c => !selectedCurations.has(c.id)));
    setSelectedCurations(new Set());
    setStatus(`Deleted ${ids.length} curations successfully.`);
  }

  function toggleSelection(id: string) {
    const next = new Set(selectedCurations);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCurations(next);
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Featured Curations</CardTitle>
          {selectedCurations.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => void deleteSelectedCurations()}>
              Delete Selected ({selectedCurations.size})
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <form
            className="grid gap-3 md:grid-cols-2 p-4 rounded-xl border border-white/5 bg-black/40"
            action={(formData) => {
              void createCuration(formData);
            }}
          >
            <Input name="type" placeholder="featured|collection" required className="bg-black/40 border-white/10" />
            <Input name="title" placeholder="Best RPG Deals This Week" required className="bg-black/40 border-white/10" />
            <Input name="description" placeholder="Optional description" className="md:col-span-2 bg-black/40 border-white/10" />
            <Textarea name="itemsJson" placeholder='[{"gameSlug":"cyberpunk-2077"}]' className="md:col-span-2 bg-black/40 border-white/10 font-mono text-sm" required />
            <Button type="submit" className="md:w-fit bg-cyan-600 hover:bg-cyan-500 text-white border-none transition-all">Save curation</Button>
          </form>
          
          <div className="space-y-2 text-sm text-zinc-300">
            {curations.length === 0 ? <p className="text-zinc-500">No curations available.</p> : null}
            {curations.map((curation) => (
              <div key={curation.id} className="relative flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedCurations.has(curation.id)}
                    onChange={() => toggleSelection(curation.id)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 accent-cyan-400 cursor-pointer"
                  />
                  <div>
                    <p className="font-medium text-white">{curation.title}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">{curation.type}</p>
                  </div>
                </div>
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
