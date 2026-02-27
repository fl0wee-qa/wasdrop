import crypto from "node:crypto";

import { RelyingParty } from "openid";

import { env } from "@/lib/env";

const OPENID_ENDPOINT = "https://steamcommunity.com/openid";

function buildRelyingParty(returnUrl: string, realm: string) {
  return new RelyingParty(returnUrl, realm, true, true, []);
}

export async function createSteamAuthUrl(returnUrl: string, realm: string): Promise<string> {
  const rp = buildRelyingParty(returnUrl, realm);

  return new Promise((resolve, reject) => {
    rp.authenticate(OPENID_ENDPOINT, false, (error, authUrl) => {
      if (error || !authUrl) {
        reject(error ?? new Error("Failed to generate Steam auth URL"));
        return;
      }

      resolve(authUrl);
    });
  });
}

export async function verifySteamAssertion(fullUrl: string, returnUrl: string, realm: string) {
  const rp = buildRelyingParty(returnUrl, realm);

  const result = await new Promise<{ authenticated?: boolean; claimedIdentifier?: string }>(
    (resolve, reject) => {
      rp.verifyAssertion(fullUrl, (error, verificationResult) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(verificationResult);
      });
    },
  );

  if (!result.authenticated || !result.claimedIdentifier) {
    return null;
  }

  const steamId = result.claimedIdentifier.split("/").pop();
  if (!steamId) {
    return null;
  }

  return steamId;
}

export function createSteamLoginToken(steamId: string, ttlSeconds = 300) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${steamId}.${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", env().NEXTAUTH_SECRET)
    .update(payload)
    .digest("base64url");

  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifySteamLoginToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [steamId, expiresAtRaw, signature] = decoded.split(".");
    if (!steamId || !expiresAtRaw || !signature) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (Number.isNaN(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", env().NEXTAUTH_SECRET)
      .update(`${steamId}.${expiresAt}`)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    return { steamId };
  } catch {
    return null;
  }
}
