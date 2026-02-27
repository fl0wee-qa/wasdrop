import { describe, expect, it } from "vitest";

import { canSendAlertEmail } from "@/lib/email";

describe("email consent gating", () => {
  it("does not send when marketing opt-in is false", () => {
    expect(
      canSendAlertEmail({
        marketingOptIn: false,
        email: "user@example.com",
        resendApiKey: "key",
        alertsFromEmail: "alerts@example.com",
      }),
    ).toBe(false);
  });

  it("does not send when provider config is missing", () => {
    expect(
      canSendAlertEmail({
        marketingOptIn: true,
        email: "user@example.com",
        resendApiKey: "",
        alertsFromEmail: "alerts@example.com",
      }),
    ).toBe(false);
  });

  it("sends only with opt-in and full provider configuration", () => {
    expect(
      canSendAlertEmail({
        marketingOptIn: true,
        email: "user@example.com",
        resendApiKey: "key",
        alertsFromEmail: "alerts@example.com",
      }),
    ).toBe(true);
  });
});
