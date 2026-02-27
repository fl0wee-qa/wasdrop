import { describe, expect, it } from "vitest";

import { signInCredentialsSchema, signUpSchema } from "@/lib/validation/auth";

describe("auth validation schemas", () => {
  it("rejects weak password on sign-up", () => {
    const parsed = signUpSchema.safeParse({
      email: "user@example.com",
      password: "weakpass",
      confirmPassword: "weakpass",
      marketingOptIn: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts strong password on sign-up", () => {
    const parsed = signUpSchema.safeParse({
      email: "user@example.com",
      password: "StrongPass1",
      confirmPassword: "StrongPass1",
      marketingOptIn: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("requires email and password for sign-in", () => {
    const parsed = signInCredentialsSchema.safeParse({
      email: "invalid",
      password: "",
    });

    expect(parsed.success).toBe(false);
  });
});
