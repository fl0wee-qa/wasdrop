import Link from "next/link";

import { AdminAiConsole } from "@/components/admin/admin-ai-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/access";
import { env, isAdminAiEnabled } from "@/lib/env";

export default async function AdminAiPage() {
  await requireAdmin();

  const enabled = isAdminAiEnabled();
  const configured = Boolean(env().QWEN_ADMIN_API_KEY && env().QWEN_ADMIN_BASE_URL);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-zinc-50">Admin AI</h1>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Admin Console</Link>
        </Button>
      </div>

      {!enabled || !configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Admin AI Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-300">
            <p>
              Enable `ADMIN_AI_ENABLED=true` and set `QWEN_ADMIN_API_KEY` + `QWEN_ADMIN_BASE_URL` to use this feature.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AdminAiConsole />
      )}
    </div>
  );
}
