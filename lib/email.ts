import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export function canSendAlertEmail(input: {
  marketingOptIn: boolean;
  email: string | null;
  resendApiKey?: string;
  alertsFromEmail?: string;
}) {
  return Boolean(input.marketingOptIn && input.email && input.resendApiKey && input.alertsFromEmail);
}

export async function queuePriceAlertNotification(input: {
  userId: string;
  gameId: string;
  targetPriceCents: number;
  country: string;
  currency: string;
}) {
  const [user, game] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, marketingOptIn: true },
    }),
    prisma.game.findUnique({
      where: { id: input.gameId },
      select: { title: true, slug: true },
    }),
  ]);

  if (!user) {
    return;
  }

  if (!user.marketingOptIn) {
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "PRICE_ALERT_NOTIFICATION_SKIPPED_NO_CONSENT",
        metadataJson: {
          gameId: input.gameId,
          targetPriceCents: input.targetPriceCents,
          country: input.country,
          currency: input.currency,
        },
      },
    });
    return;
  }

  const e = env();
  const appBaseUrl = e.NEXTAUTH_URL ?? "http://127.0.0.1:3000";
  const deliveryEnabled = canSendAlertEmail({
    marketingOptIn: user.marketingOptIn,
    email: user.email ?? null,
    resendApiKey: e.RESEND_API_KEY,
    alertsFromEmail: e.ALERTS_FROM_EMAIL,
  });

  if (!deliveryEnabled) {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.userId,
        action: "PRICE_ALERT_STUB_QUEUED",
        metadataJson: {
          gameId: input.gameId,
          targetPriceCents: input.targetPriceCents,
          country: input.country,
          currency: input.currency,
          note: "Email provider not configured; notification delivery is stubbed.",
        },
      },
    });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${e.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: e.ALERTS_FROM_EMAIL,
      to: [user.email],
      subject: `WASDrop alert created for ${game?.title ?? "game"}`,
      html: `
        <p>Your price alert was saved on WASDrop.</p>
        <p>Game: <strong>${game?.title ?? input.gameId}</strong></p>
        <p>Target: ${(input.targetPriceCents / 100).toFixed(2)} ${input.currency} (${input.country})</p>
        <p>Track deals here: ${appBaseUrl}/game/${game?.slug ?? ""}</p>
      `,
    }),
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: input.userId,
      action: response.ok ? "PRICE_ALERT_EMAIL_SENT" : "PRICE_ALERT_EMAIL_FAILED",
      metadataJson: {
        gameId: input.gameId,
        targetPriceCents: input.targetPriceCents,
        country: input.country,
        currency: input.currency,
        status: response.status,
      },
    },
  });
}
