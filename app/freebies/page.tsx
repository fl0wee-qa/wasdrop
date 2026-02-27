import { DealCard } from "@/components/deals/deal-card";
import { getAuthSession } from "@/lib/auth";
import { getFreebies } from "@/lib/services/deals-service";
import { resolveCountry } from "@/lib/services/user-preferences";

export default async function FreebiesPage() {
  const session = await getAuthSession();
  const country = await resolveCountry(session?.user?.id);
  const freebies = await getFreebies(country, 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-zinc-50">Freebies</h1>
        <p className="text-zinc-400">Current zero-cost offers from supported stores in region {country}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {freebies.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}
