import "dotenv/config";

import { syncDealsJob } from "@/lib/jobs/sync-deals";
import { syncNewsJob } from "@/lib/jobs/sync-news";

async function main() {
  const command = process.argv[2];

  if (command === "deals") {
    const countries = process.argv[3]?.split(",").map((value) => value.trim());
    const result = await syncDealsJob(countries);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "news") {
    const result = await syncNewsJob();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error("Use: tsx lib/jobs/cli.ts [deals|news] [optional-country-list]");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
