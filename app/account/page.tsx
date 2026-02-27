import { AccountPanel } from "@/components/account/account-panel";
import { AccountSettings } from "@/components/account/account-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/access";
import { getCountryOption } from "@/lib/regions";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await requireUser();

  const [user, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    }),
    prisma.userActivity.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { game: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <AccountSettings
        email={user?.email ?? null}
        preferredCountry={getCountryOption(user?.preferredCountry).code}
        marketingOptIn={user?.marketingOptIn ?? false}
        providers={[
          ...(user?.passwordHash ? ["credentials"] : []),
          ...(user?.steamId ? ["steam"] : []),
          ...new Set((user?.accounts ?? []).map((item) => item.provider)),
        ]}
      />

      <AccountPanel country={user?.preferredCountry ?? "US"} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {activity.map((entry) => (
            <p key={entry.id} className="rounded-md border border-zinc-800 p-2 break-words">
              {entry.type} {entry.game?.title ? `- ${entry.game.title}` : ""} ({entry.createdAt.toLocaleString()})
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
