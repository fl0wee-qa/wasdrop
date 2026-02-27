import { expect, test } from "@playwright/test";

test("home page renders deals/news shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("WAS");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Deals", exact: true })).toBeVisible();
});

