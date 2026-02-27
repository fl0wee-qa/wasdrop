import { env } from "@/lib/env";
import { runTrackedJob } from "@/lib/jobs/status";
import { syncDeals } from "@/lib/services/deals-service";

export async function syncDealsJob(countryList?: string[]) {
  return runTrackedJob("syncDeals", async () => {
    const countries = countryList?.length
      ? countryList
      : env()
          .DEALS_SYNC_COUNTRIES.split(",")
          .map((value) => value.trim())
          .filter(Boolean);

    const results = [] as Array<{ country: string; count: number; adapter: string }>;
    for (const country of countries) {
      const result = await syncDeals(country);
      results.push(result);
    }

    return { countries: results };
  });
}
