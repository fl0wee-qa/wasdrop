import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { consumeRateLimit, getClientIp } from "@/lib/ip-rate-limit";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit({
    bucket: "auth.signup",
    key: ip,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many sign-up attempts. Retry in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const parsed = signUpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sign-up payload", issues: parsed.error.issues }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      marketingOptIn: parsed.data.marketingOptIn,
      role: env().ADMIN_EMAIL?.toLowerCase() === email ? "ADMIN" : "USER",
    },
    select: { id: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: created.id,
      action: "ACCOUNT_SIGNUP_CREDENTIALS",
      metadataJson: {
        marketingOptIn: parsed.data.marketingOptIn,
      },
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
