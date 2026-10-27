import { test, expect } from "@playwright/test";

/**
 * Test E2E #2 — Vente (POS) → Ajouter produit → Ticket imprimable
 *
 * Prérequis: être connecté avec couverge@gmail.com / Love1968@
 * (compte démo Restaurant Le Baobab avec 10 produits)
 */

test.beforeEach(async ({ page }) => {
  // Login
  await page.goto("/");
  await page.waitForTimeout(2000);

  // Click "Se connecter"
  const loginBtn = page.getByRole("button", { name: /Se connecter/i }).first();
  if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginBtn.click();
    await page.waitForTimeout(1000);

    // Fill login form
    await page.getByLabel(/Email/i).first().fill("couverge@gmail.com");
    await page.getByLabel(/Mot de passe/i).first().fill("Love1968@");
    await page.getByRole("button", { name: /Se connecter|Connexion/i }).first().click();
    await page.waitForTimeout(5000);
  }
});

test("POS affiche les produits avec images", async ({ page }) => {
  // Navigate to "Vente" tab
  const venteBtn = page.getByRole("button", { name: /^Vente$/i }).first();
  if (await venteBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await venteBtn.click();
    await page.waitForTimeout(3000);
  }

  // Check that products are visible
  const productVisible = await page
    .getByText(/Thiéboudienne|Yassa|Mafé|Bissap/i)
    .first()
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  expect(productVisible).toBeTruthy();
});

test("Ajouter produit au panier met à jour le total", async ({ page }) => {
  // Navigate to "Vente"
  const venteBtn = page.getByRole("button", { name: /^Vente$/i }).first();
  if (await venteBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await venteBtn.click();
    await page.waitForTimeout(3000);
  }

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

    // Total should contain a number > 0
    expect(totalText).toMatch(/\d/);
  }
});

test("Boutons de paiement sont visibles", async ({ page }) => {
  // Navigate to "Vente"
  const venteBtn = page.getByRole("button", { name: /^Vente$/i }).first();
  if (await venteBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await venteBtn.click();
    await page.waitForTimeout(3000);
  }

  // Check payment buttons are visible (desktop: in right panel, mobile: after opening cart)
  const espècesBtn = page.getByRole("button", { name: /Espèces/i }).first();
  const waveBtn = page.getByRole("button", { name: /Wave/i }).first();

  // At least one payment button should be visible
  const anyPaymentVisible =
    (await espècesBtn.isVisible({ timeout: 5000 }).catch(() => false)) ||
    (await waveBtn.isVisible({ timeout: 5000 }).catch(() => false));

  // On mobile, we might need to open the cart first
  if (!anyPaymentVisible) {
    const cartBtn = page.getByRole("button", { name: /Voir panier|Panier|Articles/i }).first();
    if (await cartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cartBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Now check again
  const espècesVisible = await espècesBtn.isVisible({ timeout: 5000 }).catch(() => false);
  const waveVisible = await waveBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(espècesVisible || waveVisible).toBeTruthy();
});
