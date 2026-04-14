import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Scenario 10: Accessibility — axe-core scan on major routes.
 */
test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const email = process.env.E2E_USER_EMAIL || "alice@test.local";
    const password = process.env.E2E_USER_PASSWORD || "testpass123";
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  });

  const routes = ["/", "/settings", "/memory"];

  for (const route of routes) {
    test(`no critical axe violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );
      expect(critical).toHaveLength(0);
    });
  }
});
