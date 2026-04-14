import { test, expect } from "@playwright/test";

/**
 * Scenario 1: Login -> new topic -> send message -> stream response -> sidebar updates.
 */
test.describe("Login, topic, and streaming", () => {
  test("creates topic, sends message, gets streamed response", async ({
    page,
  }) => {
    await page.goto("/");

    // Login (assumes test credentials from CI env).
    const email = process.env.E2E_USER_EMAIL || "alice@test.local";
    const password = process.env.E2E_USER_PASSWORD || "testpass123";

    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Wait for the main chat interface to load.
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });

    // Create a new topic via the sidebar or compose button.
    await page.getByRole("button", { name: /new|compose|\+/i }).click();

    // Type and send a message.
    const input = page.getByRole("textbox", { name: /message|chat/i });
    await input.fill("What is the capital of France?");
    await input.press("Enter");

    // Stream response should appear — wait for assistant message.
    const response = page.locator('[data-role="assistant"]').first();
    await expect(response).toBeVisible({ timeout: 30_000 });
    await expect(response).toContainText(/paris/i, { timeout: 30_000 });

    // Sidebar should now list the new topic.
    const sidebar = page.getByRole("navigation");
    await expect(sidebar.getByText(/france|capital/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
