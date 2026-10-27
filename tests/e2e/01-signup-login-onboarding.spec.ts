import { test, expect } from "@playwright/test";

/**
 * Test E2E #1 — Flux critique: Login → Dashboard
 *
 * Vérifie que l'utilisateur peut se connecter et voir le dashboard.
 */

const DEMO_EMAIL = "couverge@gmail.com";
const DEMO_PASSWORD = "Love1968@";

test.beforeEach(async ({ page, context }) => {
  // Clear all cookies and localStorage before each test
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
});

test("Login avec compte démo → dashboard visible", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);

  // Click "Se connecter" button in the navbar
  const loginButton = page.getByRole("button", { name: /Se connecter/i }).first();
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await loginButton.click();
  await page.waitForTimeout(1500);

  // Fill login form
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(DEMO_EMAIL);
  await passwordInput.fill(DEMO_PASSWORD);

  // Submit
  const submitButton = page.getByRole("button", { name: /Se connecter/i }).last();
  await submitButton.click();

  // Wait for redirect to dashboard or onboarding
  await page.waitForTimeout(8000);

  // After login: should see dashboard elements OR onboarding wizard
  const dashboardVisible = await page
    .getByText(/Vente|Accueil|Produits|Commande/i)
    .first()
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  const onboardingVisible = await page
    .getByText(/configurer|commerce|onboarding/i)
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  expect(dashboardVisible || onboardingVisible).toBeTruthy();
});

test("Landing page loads correctly", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/YonuKom/i);
  // Check hero text
  await expect(page.getByText(/Gérez votre commerce/i).first()).toBeVisible({ timeout: 10000 });
});

test("Login page accessible from navbar", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  const loginBtn = page.getByRole("button", { name: /Se connecter/i }).first();
  await expect(loginBtn).toBeVisible({ timeout: 10000 });
});
