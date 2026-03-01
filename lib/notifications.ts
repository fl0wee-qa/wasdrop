import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createNotificationEvent(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
  metadataJson?: Prisma.InputJsonValue;
}) {
  return prisma.notificationEvent.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
      metadataJson: input.metadataJson,
    },
  });
}
