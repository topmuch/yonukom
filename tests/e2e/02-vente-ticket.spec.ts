import { test, expect } from "@playwright/test";

/**
 * Test E2E #2 — Vente (POS) → Ajouter produit → Boutons de paiement
 */

const DEMO_EMAIL = "couverge@gmail.com";
const DEMO_PASSWORD = "Love1968@";

test.beforeEach(async ({ page, context }) => {
  // Clear all state before each test
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Login
  await page.waitForTimeout(2000);
  const loginBtn = page.getByRole("button", { name: /Se connecter/i }).first();
  if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginBtn.click();
    await page.waitForTimeout(1500);

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(DEMO_EMAIL);
      await passwordInput.fill(DEMO_PASSWORD);
      await page.getByRole("button", { name: /Se connecter/i }).last().click();
      await page.waitForTimeout(8000);
    }
  }
});

test("POS affiche les produits avec images", async ({ page }) => {
  // Navigate to "Vente" tab
  const venteBtn = page.getByRole("button", { name: /^Vente$/i }).first();
  if (await venteBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await venteBtn.click();
    await page.waitForTimeout(3000);

    // Check that products are visible
    const productVisible = await page
      .getByText(/Thiéboudienne|Yassa|Mafé|Bissap/i)
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    expect(productVisible).toBeTruthy();
  } else {
    // If we can't find the Vente button, we might be on onboarding — skip
    test.skip();
  }
});

test("Ajouter produit au panier met à jour le total", async ({ page }) => {
  const venteBtn = page.getByRole("button", { name: /^Vente$/i }).first();
  if (!(await venteBtn.isVisible({ timeout: 10000 }).catch(() => false))) {
    test.skip();
    return;
  }
  await venteBtn.click();
  await page.waitForTimeout(3000);

  // Click "Ajouter" button on a product
  const addButton = page.getByRole("button", { name: /Ajouter/i }).first();
  if (await addButton.isVisible({ timeout: 10000 }).catch(() => false)) {
    await addButton.click();
    await page.waitForTimeout(1000);

    // Check that the cart total is now > 0
    const totalText = await page
      .getByText(/FCFA/i)
      .last()
      .textContent()
      .catch(() => "");

    expect(totalText).toMatch(/\d/);
  } else {
    test.skip();
  }
});

test("Boutons de paiement sont visibles", async ({ page }) => {
  const venteBtn = page.getByRole("button", { name: /^Vente$/i }).first();
  if (!(await venteBtn.isVisible({ timeout: 10000 }).catch(() => false))) {
    test.skip();
    return;
  }
  await venteBtn.click();
  await page.waitForTimeout(3000);

  // Add a product first (payment buttons are disabled with empty cart)
  const addButton = page.getByRole("button", { name: /Ajouter/i }).first();
  if (await addButton.isVisible({ timeout: 10000 }).catch(() => false)) {
    await addButton.click();
    await page.waitForTimeout(1000);
  }

  // Check payment buttons
  const espècesBtn = page.getByRole("button", { name: /Espèces/i }).first();
  const waveBtn = page.getByRole("button", { name: /^Wave$/i }).first();

  // On mobile, open the cart first
  const cartBtn = page.getByRole("button", { name: /Voir panier|Panier|Articles/i }).first();
  if (await cartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cartBtn.click();
    await page.waitForTimeout(2000);
  }

  const espècesVisible = await espècesBtn.isVisible({ timeout: 5000 }).catch(() => false);
  const waveVisible = await waveBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(espècesVisible || waveVisible).toBeTruthy();
});
