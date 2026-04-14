import { test, expect } from "@playwright/test";

/**
 * Scenario 2: Multi-topic navigation, back/forward preserves state.
 */
test.describe("Multi-topic navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const email = process.env.E2E_USER_EMAIL || "alice@test.local";
    const password = process.env.E2E_USER_PASSWORD || "testpass123";
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  });

  test("navigates between topics preserving state", async ({ page }) => {
    // Open first topic from sidebar.
    const sidebar = page.getByRole("navigation");
    const topics = sidebar.locator("a, button").filter({ hasText: /.+/ });
    const topicCount = await topics.count();

    if (topicCount < 2) {
      test.skip(true, "Need at least 2 existing topics to test navigation");
    }

    // Click first topic, note its title.
    await topics.first().click();
    const firstTitle = await page.locator("h1, [data-testid='topic-title']").innerText();

    // Navigate to second topic.
    await topics.nth(1).click();
    const secondTitle = await page.locator("h1, [data-testid='topic-title']").innerText();
    expect(secondTitle).not.toBe(firstTitle);

    // Browser back should restore first topic.
    await page.goBack();
    await expect(
      page.locator("h1, [data-testid='topic-title']")
    ).toHaveText(firstTitle, { timeout: 5_000 });

    // Forward should restore second topic.
    await page.goForward();
    await expect(
      page.locator("h1, [data-testid='topic-title']")
    ).toHaveText(secondTitle, { timeout: 5_000 });
  });
});
