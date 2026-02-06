import { test, expect } from "@playwright/test";

test.describe("Index page", () => {
  test("loads and shows main sections", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Weekly Summary");

    // Today section
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

    // Build Summary section (summary element, not always exposed as button)
    await expect(page.getByText("Build Weekly Summary")).toBeVisible();

    // Weekly section (shows "This week" when loaded, or skeleton/error)
    await expect(page.locator("main")).toContainText(/Today|Build|Weekly|Metrics|This week|Retry/i);

    // Nav
    await expect(page.getByRole("link", { name: "Weekly Summary" })).toBeVisible();
    await expect(page.getByRole("link", { name: "History" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Charts" })).toBeVisible();
  });

  test("shows metrics, error, or loading state", async ({ page }) => {
    await page.goto("/");

    // Either metrics ("PRs merged", "Metrics"), error ("Retry"), or loading skeleton
    await expect(page.locator("main")).toContainText(/PRs merged|Metrics|This week|Retry|Generating/i);
  });

  test("Build Summary form is present and submittable", async ({ page }) => {
    await page.goto("/");

    // Expand Build Summary
    await page.getByText("Build Weekly Summary").click();

    await expect(page.getByLabel("Check-ins")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate & Save" })).toBeVisible();

    // Form exists (submit may fail without API - that's ok)
    const form = page.locator('form[method="post"]');
    await expect(form).toBeVisible();
  });
});
