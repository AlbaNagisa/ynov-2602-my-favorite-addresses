import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

test("shows Signup button and allows clicking it", async ({ page }) => {
  await page.goto("/");

  const signupTab = page.getByTestId("signup-tab");
  await expect(signupTab).toBeVisible();
  await signupTab.click();

  await expect(page.getByTestId("signup-form")).toBeVisible();
});

test("submits signup form and displays success toast", async ({ page }) => {
  await page.route("**/api/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        item: { id: 1, email: "e2e.signup@example.com" },
      }),
    });
  });

  await page.goto("/");
  await page.getByTestId("signup-tab").click();
  await page.getByTestId("signup-email").fill("e2e.signup@example.com");
  await page.getByTestId("signup-password").fill("supersecret123");
  await page.getByTestId("signup-submit").click();

  await expect(page.getByTestId("toast-message")).toContainText("Inscription reussie.");
});

test("logs in and shows dashboard", async ({ page }) => {
  await page.route("**/api/users/tokens", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "fake-token" }),
    });
  });

  await page.goto("/");
  await page.getByTestId("login-tab").click();
  await page.getByTestId("login-email").fill("e2e.login@example.com");
  await page.getByTestId("login-password").fill("supersecret123");
  await page.getByTestId("login-submit").click();

  await expect(page.getByTestId("dashboard-title")).toBeVisible();
});
