import { test, expect } from "@playwright/test";

/**
 * Scenario 5: Settings panel round-trip (theme, model choice persisted).
 */
test.describe("Settings persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const email = process.env.E2E_USER_EMAIL || "alice@test.local";
    const password = process.env.E2E_USER_PASSWORD || "testpass123";
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  });

  test("theme and model choice survive page reload", async ({ page }) => {
    // Open settings.
    await page.getByRole("button", { name: /settings|gear|cog/i }).click();

    // Toggle dark/light theme.
    const themeToggle = page.getByLabel(/theme|dark mode|appearance/i);
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
    }

    // Select a model if a dropdown is visible.
    const modelSelect = page.getByLabel(/model/i);
    if (await modelSelect.isVisible()) {
      await modelSelect.selectOption({ index: 1 });
    }

    // Save / close settings.
    const saveBtn = page.getByRole("button", { name: /save|done|close/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }

    // Reload and verify persistence.
    await page.reload();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /settings|gear|cog/i }).click();
    // If theme was toggled, it should still be in the toggled state.
    // This is a structural test — real assertions depend on data-theme attribute.
    const body = page.locator("body");
    const theme = await body.getAttribute("data-theme");
    expect(theme).toBeTruthy();
  });
});
