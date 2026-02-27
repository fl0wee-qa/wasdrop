import { expect, test } from "@playwright/test";

test("credentials sign-up auto signs in and opens account", async ({ page }) => {
  const email = `wasdrop+${Date.now()}@example.com`;
  const password = "StrongPass1";

  await page.goto("/auth/sign-up");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByPlaceholder("Confirm password").fill(password);
  await page.getByRole("button", { name: "Sign Up" }).click();

  await page.waitForURL("**/account", { timeout: 20000 });
  await expect(page).toHaveURL(/\/account$/);
});

test("credentials can sign in again after sign out", async ({ page }) => {
  const email = `wasdrop+${Date.now()}@example.com`;
  const password = "StrongPass1";

  await page.goto("/auth/sign-up");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByPlaceholder("Confirm password").fill(password);
  await page.getByRole("button", { name: "Sign Up" }).click();
  await page.waitForURL("**/account", { timeout: 20000 });

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/");

  await page.goto("/auth/sign-in");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/account", { timeout: 20000 });
  await expect(page).toHaveURL(/\/account$/);
});
