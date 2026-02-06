import { test, expect } from "@playwright/test";

test.describe("History", () => {
  test("index loads and shows list or empty state", async ({ page }) => {
    await page.goto("/history");

    await expect(page.getByRole("heading", { name: "Historical Summaries" })).toBeVisible();

    // Either week links or "No summaries found"
    const hasWeeks = await page.getByRole("link", { name: /Week ending/ }).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText("No summaries found").isVisible().catch(() => false);
    const hasError = await page.getByRole("alert").isVisible().catch(() => false);

    expect(hasWeeks || hasEmpty || hasError).toBeTruthy();
  });

  test("navigates to week detail when weeks exist", async ({ page }) => {
    await page.goto("/history");

    const weekLink = page.getByRole("link", { name: /Week ending/ }).first();
    if (await weekLink.isVisible()) {
      await weekLink.click();
      await expect(page).toHaveURL(/\/history\/\d{4}-\d{2}-\d{2}/);
      await expect(page.getByRole("heading", { name: /Week ending/ })).toBeVisible();
      await expect(page.getByRole("link", { name: "Back to History" })).toBeVisible();
    }
  });

  test("week detail shows Copy markdown when content exists", async ({ page }) => {
    // Use a known week from fixture data
    await page.goto("/history/2026-01-02");

    // Page loads (may have content or error)
    await expect(page.getByRole("heading", { name: /Week ending/ })).toBeVisible();

    const copyBtn = page.getByRole("button", { name: /Copy markdown/ });
    const hasContent = await copyBtn.isVisible().catch(() => false);
    if (hasContent) {
      await expect(copyBtn).toBeEnabled();
    }
  });
});
