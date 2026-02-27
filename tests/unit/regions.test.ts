import { describe, expect, it } from "vitest";

import { DEFAULT_COUNTRY, formatMoney, getCountryOption } from "@/lib/regions";

describe("regions", () => {
  it("falls back to default country", () => {
    expect(getCountryOption("ZZ").code).toBe(DEFAULT_COUNTRY);
  });

  it("formats currency by country", () => {
    const formatted = formatMoney(1999, "US", "USD");
    expect(formatted).toContain("19");
  });
});
