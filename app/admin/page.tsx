import Link from "next/link";

import { AdminConsole } from "@/components/admin/admin-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/access";
import { getJobStatus } from "@/lib/jobs/status";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();

  const [curations, sources, jobRuns] = await Promise.all([
    prisma.adminCuration.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.newsSource.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    getJobStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl text-zinc-50">Admin Console</h1>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/admin/ai">Open Admin AI</Link>
        </Button>
      </div>
      <AdminConsole curations={curations} sources={sources} />
      <Card>
        <CardHeader>
          <CardTitle>Job Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {jobRuns.map((run) => (
            <div key={run.id} className="rounded-md border border-zinc-800 p-2">
              <p>
                {run.jobName} - {run.status}
              </p>
              <p className="text-zinc-500">{run.startedAt.toLocaleString()}</p>
              <p className="text-zinc-500">{run.message ?? ""}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
