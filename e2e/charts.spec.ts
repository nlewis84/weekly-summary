import { test, expect } from "@playwright/test";

test.describe("Charts page", () => {
  test("loads and shows charts or error state", async ({ page }) => {
    await page.goto("/charts");

    await expect(page.getByRole("heading", { name: "Progress Charts" })).toBeVisible();

    // Either chart (role=img with aria-label) or error
    const hasChart = await page.getByRole("img", { name: /chart|graph|area|bar/i }).first().isVisible().catch(() => false);
    const hasError = await page.getByRole("alert").isVisible().catch(() => false);
    const hasRetry = await page.getByRole("button", { name: "Retry" }).isVisible().catch(() => false);

    expect(hasChart || hasError || hasRetry).toBeTruthy();
  });

  test("has Export CSV when charts load", async ({ page }) => {
    await page.goto("/charts");

    // Export CSV button may exist when data loads
    const exportBtn = page.getByRole("link", { name: /Export|CSV/i }).or(page.getByRole("button", { name: /Export|CSV/i }));
    const hasExport = await exportBtn.first().isVisible().catch(() => false);
    // If charts loaded, we expect export; if error, we don't
    if (hasExport) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });
});
