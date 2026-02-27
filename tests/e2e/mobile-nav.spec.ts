import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("mobile navigation opens and shows core actions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.getByTestId("mobile-nav-drawer");

  await expect(drawer.getByRole("link", { name: "Deals", exact: true })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Freebies", exact: true })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "News", exact: true })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "AI Chat", exact: true })).toBeVisible();
  await expect(drawer.getByText("US - United States")).toBeVisible();
});
