import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createSteamAuthUrl } from "@/lib/steam-openid";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = env().NEXTAUTH_URL ?? `${requestUrl.protocol}//${requestUrl.host}`;
  const returnUrl = env().STEAM_RETURN_URL ?? `${baseUrl}/api/auth/steam/callback`;
  const realm = env().STEAM_REALM_URL ?? baseUrl;

  const authUrl = await createSteamAuthUrl(returnUrl, realm);
  return NextResponse.redirect(authUrl);
}
