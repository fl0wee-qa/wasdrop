import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "ACCOUNT_DELETE_SELF",
      metadataJson: {
        userId: session.user.id,
      },
    },
  });

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ success: true });
}
