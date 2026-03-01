import Link from "next/link";

import { AdminConsole } from "@/components/admin/admin-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/access";
import { getJobStatus } from "@/lib/jobs/status";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();

  const [curations, sources, jobRuns, expiredDealsCount, disabledSourcesCount] = await Promise.all([
    prisma.adminCuration.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.newsSource.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    getJobStatus(),
    prisma.deal.count({ where: { endAt: { lt: new Date() } } }),
    prisma.newsSource.count({ where: { isEnabled: false } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-black text-white text-glow-cyan">Admin Console</h1>
        <Button asChild variant="outline" className="w-full sm:w-auto border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
          <Link href="/admin/ai">Open Admin AI</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-pink-400">Data Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400">Expired Deals</span>
              <span className="font-bold text-red-400">{expiredDealsCount}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400">Disabled Sources</span>
              <span className="font-bold text-orange-400">{disabledSourcesCount}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400">Recent Jobs</span>
              <span className="font-bold text-emerald-400">{jobRuns.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Job Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300 max-h-48 overflow-y-auto">
            {jobRuns.length === 0 ? <p className="text-zinc-500">No jobs run recently.</p> : null}
            {jobRuns.map((run) => (
              <div key={run.id} className="rounded border border-white/10 p-2 flex justify-between items-center bg-black/40">
                <div>
                  <span className="font-bold text-cyan-300">{run.jobName}</span>
                  <span className="ml-2 text-xs text-zinc-500">{run.startedAt.toLocaleString()}</span>
                  <p className="text-xs text-zinc-400 mt-1">{run.message ?? ""}</p>
                </div>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${run.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                  {run.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AdminConsole curations={curations} sources={sources} />
    </div>
  );
}
