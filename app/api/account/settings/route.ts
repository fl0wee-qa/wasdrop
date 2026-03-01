import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCountryOption } from "@/lib/regions";

const settingsSchema = z.object({
  preferredCountry: z.string().length(2).optional(),
  marketingOptIn: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  webPushEnabled: z.boolean().optional(),
  digestEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      preferredCountry: true,
      marketingOptIn: true,
      steamId: true,
      passwordHash: true,
      accounts: {
        select: {
          provider: true,
        },
      },
      notificationPreference: {
        select: {
          emailEnabled: true,
          webPushEnabled: true,
          digestEnabled: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const providers = new Set(user.accounts.map((item) => item.provider));
  if (user.steamId) {
    providers.add("steam");
  }
  if (user.passwordHash) {
    providers.add("credentials");
  }

  return NextResponse.json({
    email: user.email,
    preferredCountry: getCountryOption(user.preferredCountry).code,
    marketingOptIn: user.marketingOptIn,
    notificationPreferences: {
      emailEnabled: user.notificationPreference?.emailEnabled ?? true,
      webPushEnabled: user.notificationPreference?.webPushEnabled ?? false,
      digestEnabled: user.notificationPreference?.digestEnabled ?? false,
    },
    providers: [...providers],
  });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const data: { preferredCountry?: string; marketingOptIn?: boolean } = {};
  const preferenceData: { emailEnabled?: boolean; webPushEnabled?: boolean; digestEnabled?: boolean } = {};

  if (payload.preferredCountry) {
    data.preferredCountry = getCountryOption(payload.preferredCountry).code;
  }
  if (typeof payload.marketingOptIn === "boolean") {
    data.marketingOptIn = payload.marketingOptIn;
  }
  if (typeof payload.emailEnabled === "boolean") {
    preferenceData.emailEnabled = payload.emailEnabled;
  }
  if (typeof payload.webPushEnabled === "boolean") {
    preferenceData.webPushEnabled = payload.webPushEnabled;
  }
  if (typeof payload.digestEnabled === "boolean") {
    preferenceData.digestEnabled = payload.digestEnabled;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: session.user.id },
      data,
      select: {
        preferredCountry: true,
        marketingOptIn: true,
      },
    });

    if (Object.keys(preferenceData).length > 0) {
      await tx.notificationPreference.upsert({
        where: { userId: session.user.id },
        update: preferenceData,
        create: {
          userId: session.user.id,
          ...preferenceData,
        },
      });
    }

    const preferences = await tx.notificationPreference.findUnique({
      where: { userId: session.user.id },
      select: {
        emailEnabled: true,
        webPushEnabled: true,
        digestEnabled: true,
      },
    });

    return {
      ...user,
      notificationPreferences: {
        emailEnabled: preferences?.emailEnabled ?? true,
        webPushEnabled: preferences?.webPushEnabled ?? false,
        digestEnabled: preferences?.digestEnabled ?? false,
      },
    };
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "ACCOUNT_SETTINGS_UPDATE",
      metadataJson: {
        preferredCountry: updated.preferredCountry,
        marketingOptIn: updated.marketingOptIn,
        notificationPreferences: updated.notificationPreferences,
      },
    },
  });

  return NextResponse.json({
    preferredCountry: updated.preferredCountry,
    marketingOptIn: updated.marketingOptIn,
    notificationPreferences: updated.notificationPreferences,
  });
}
