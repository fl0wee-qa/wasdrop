import { describe, expect, it } from "vitest";

import { createSteamLoginToken, verifySteamLoginToken } from "@/lib/steam-openid";

describe("steam token bridge", () => {
  it("creates and verifies a valid token", () => {
    const token = createSteamLoginToken("76561198000000000", 60);
    const verified = verifySteamLoginToken(token);

    expect(verified?.steamId).toBe("76561198000000000");
  });

  it("rejects a malformed token", () => {
    expect(verifySteamLoginToken("bad-token")).toBeNull();
  });
});
