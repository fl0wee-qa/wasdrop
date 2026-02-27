import { NextResponse } from "next/server";

import { createSteamLoginToken, verifySteamAssertion } from "@/lib/steam-openid";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = env().NEXTAUTH_URL ?? `${requestUrl.protocol}//${requestUrl.host}`;
  const returnUrl = env().STEAM_RETURN_URL ?? `${baseUrl}/api/auth/steam/callback`;
  const realm = env().STEAM_REALM_URL ?? baseUrl;

  try {
    const steamId = await verifySteamAssertion(request.url, returnUrl, realm);
    if (!steamId) {
      return NextResponse.redirect(`${baseUrl}/auth/sign-in?error=steam_verify_failed`);
    }

    const steamToken = createSteamLoginToken(steamId);
    return NextResponse.redirect(`${baseUrl}/auth/sign-in?steamToken=${encodeURIComponent(steamToken)}`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/auth/sign-in?error=steam_callback_failed`);
  }
}
