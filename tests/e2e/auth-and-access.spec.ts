import { expect, test } from "@playwright/test";

test("sign-in page renders credentials and social auth controls", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in to WASDrop" })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Steam" })).toBeVisible();
});

test("sign-up page renders password policy and marketing opt-in", async ({ page }) => {
  await page.goto("/auth/sign-up");
  await expect(page.getByRole("heading", { name: "Create your WASDrop account" })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Confirm password")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters, 1 uppercase letter, and 1 number.")).toBeVisible();
  await expect(page.getByText("I agree to receive email alerts / newsletter")).toBeVisible();
});

test("account route redirects anonymous users to auth sign-in", async ({ page }) => {
  await page.goto("/account");
  await page.waitForURL("**/auth/sign-in");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test("admin AI route is protected for anonymous users", async ({ page }) => {
  await page.goto("/admin/ai");
  await page.waitForURL("**/");
  await expect(page).toHaveURL(/\/$/);
});

test("chat page is reachable and shows enabled or disabled state", async ({ page }) => {
  await page.goto("/chat");
  const enabledHeading = page.getByRole("heading", { name: "WASDrop AI Chat" });
  const disabledHeading = page.getByRole("heading", { name: "AI Chat Unavailable" });
  await expect(enabledHeading.or(disabledHeading)).toBeVisible();
});
