import { syncDealsJob } from "@/lib/jobs/sync-deals";
import { syncNewsJob } from "@/lib/jobs/sync-news";

let started = false;

export function startInAppJobs() {
  if (started || process.env.ENABLE_IN_APP_JOBS !== "true") {
    return;
  }

  started = true;

  void syncNewsJob();
  void syncDealsJob();

  setInterval(() => {
    void syncNewsJob();
  }, 60 * 60 * 1000);

  setInterval(() => {
    void syncDealsJob();
  }, 24 * 60 * 60 * 1000);
}
