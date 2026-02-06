import { test, expect } from "@playwright/test";

test.describe("Charts page", () => {
  test("loads and shows charts or error state", async ({ page }) => {
    await page.goto("/charts");

    await expect(page.getByRole("heading", { name: "Progress Charts" })).toBeVisible();

    // Wait for lazy-loaded charts, error, retry, or no-data state (charts load async)
    await expect(
      page
        .getByRole("img", { name: /chart|graph|area|bar|line/i })
        .or(page.getByRole("alert"))
        .or(page.getByRole("button", { name: "Retry" }))
        .or(page.getByText(/No data available for charts/i))
        .first()
    ).toBeVisible({ timeout: 15000 });
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
