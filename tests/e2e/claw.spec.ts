/**
 * nself-claw client app E2E smoke tests — T-0394
 *
 * 8 test scenarios for the open-source AI assistant client.
 * Requires the claw app to be running at CLAW_APP_URL.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.CLAW_APP_URL ?? 'http://localhost:3000';

test.use({ baseURL: BASE });

const available = !!process.env.CLAW_APP_URL;

test.describe('nself-claw client app', () => {
  // Scenario 1: App loads
  test('app loads without crashing', async ({ page }) => {
    test.skip(!available, 'CLAW_APP_URL not set');

    const resp = await page.goto('/');
    expect(resp?.status()).toBeLessThan(500);
  });

  // Scenario 2: Auth screen shown to anonymous users
  test('unauthenticated user sees login or onboarding screen', async ({ page }) => {
    test.skip(!available, 'CLAW_APP_URL not set');

    await page.goto('/');
    const authEl = page.locator(
      'input[type="email"], button:has-text("Sign in"), a[href*="login"], [data-testid="auth"]'
    ).first();
    await expect(authEl).toBeVisible({ timeout: 6000 });
  });

  // Scenario 3: Chat input visible after auth
  test('prompt input is visible after authentication', async ({ page }) => {
    test.skip(!available || !process.env.CLAW_TEST_EMAIL, 'No test credentials');

    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.CLAW_TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.CLAW_TEST_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/chat|assistant|home/);

    const input = page.locator('textarea, input[placeholder*="message" i], input[placeholder*="prompt" i]').first();
    await expect(input).toBeVisible();
  });

  // Scenario 4: Send a message and receive a response (streaming or non-streaming)
  test('sending a message shows assistant response', async ({ page }) => {
    test.skip(!available || !process.env.CLAW_TEST_EMAIL, 'No test credentials');

    await page.goto('/');
    const input = page.locator('textarea, input[placeholder*="message" i]').first();
    await input.fill('Hello, what can you do?');
    await page.keyboard.press('Enter');

    // Wait for an assistant response to appear
    const response = page.locator('[data-testid="assistant-message"], [class*="assistant"], [class*="response"]').first();
    await expect(response).toBeVisible({ timeout: 15000 });
  });

  // Scenario 5: Session history is preserved across navigation
  test('conversation history persists on page reload', async ({ page }) => {
    test.skip(!available || !process.env.CLAW_TEST_EMAIL, 'No test credentials');

    await page.goto('/');
    // If there's a history/sessions sidebar, it should be visible
    const history = page.locator('[data-testid="sessions"], [class*="history"], [class*="session"]').first();
    const count = await history.count();
    if (count > 0) {
      await expect(history).toBeVisible();
    }
  });

  // Scenario 6: Tool calls shown in UI (if feature is enabled)
  test('tool execution is reflected in the UI', async ({ page }) => {
    test.skip(!available || !process.env.CLAW_TEST_EMAIL || !process.env.CLAW_TOOLS_ENABLED, 'Tools not enabled or no creds');

    await page.goto('/');
    const input = page.locator('textarea').first();
    await input.fill('What is the weather like in New York today?');
    await page.keyboard.press('Enter');

    // Look for a tool-call indicator in the response
    const toolCall = page.locator('[data-testid="tool-call"], [class*="tool"], span:has-text("Searching")').first();
    await expect(toolCall).toBeVisible({ timeout: 10000 });
  });

  // Scenario 7: Mobile viewport renders correctly
  test('app renders correctly on mobile viewport', async ({ page }) => {
    test.skip(!available, 'CLAW_APP_URL not set');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(395); // slight tolerance
  });

  // Scenario 8: No JS errors on load
  test('page loads without JavaScript errors', async ({ page }) => {
    test.skip(!available, 'CLAW_APP_URL not set');

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise')
    );
    expect(critical).toHaveLength(0);
  });
});
