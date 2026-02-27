import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl text-zinc-50">About WASDrop</h1>
      <Card>
        <CardHeader>
          <CardTitle>Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-zinc-300">
          <p>
            WASDrop helps players compare discounted PC game prices across stores and track gamer-relevant
            industry news without scraping fragile storefront pages.
          </p>
          <p>
            MVP uses an aggregator-first approach with a plugin adapter layer so direct store integrations can be added
            safely in future phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

