import { prisma } from "@/lib/prisma";

export async function runTrackedJob<T>(jobName: string, fn: () => Promise<T>) {
  const run = await prisma.jobRun.create({
    data: {
      jobName,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const result = await fn();

    await prisma.jobRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        message: "Completed successfully",
        logsJson: result as object,
      },
    });

    return result;
  } catch (error) {
    await prisma.jobRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        message: error instanceof Error ? error.message : "Unknown job error",
      },
    });

    throw error;
  }
}

export async function getJobStatus() {
  const latestRuns = await prisma.jobRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return latestRuns;
}
