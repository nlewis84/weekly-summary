import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("nav links work", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "History" }).click();
    await expect(page).toHaveURL("/history");

    await page.getByRole("link", { name: "Charts" }).click();
    await expect(page).toHaveURL("/charts");

    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL("/settings");

    await page.getByRole("link", { name: "Weekly Summary" }).click();
    await expect(page).toHaveURL("/");
  });

  test("Build Summary link scrolls to form", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Build Summary" }).click();
    await expect(page).toHaveURL(/\#build-summary/);

    const buildSummary = page.locator("#build-summary");
    await expect(buildSummary).toBeInViewport();
  });
});
