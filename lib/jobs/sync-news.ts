import { runTrackedJob } from "@/lib/jobs/status";
import { syncNews } from "@/lib/services/news-service";

export async function syncNewsJob() {
  return runTrackedJob("syncNews", async () => {
    const result = await syncNews();
    return result;
  });
}
