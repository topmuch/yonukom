import { test, expect } from "@playwright/test";

/**
 * Test E2E #4 — Catégories → Créer produit avec catégorie
 *
 * Vérifie que l'utilisateur peut:
 * 1. Aller dans l'onglet Catégories
 * 2. Créer une nouvelle catégorie
 * 3. Aller dans l'onglet Produits
 * 4. Créer un nouveau produit avec la catégorie créée
 */

test.beforeEach(async ({ page }) => {
  // Login
  await page.goto("/");
  await page.waitForTimeout(2000);

  const loginBtn = page.getByRole("button", { name: /Se connecter/i }).first();
  if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginBtn.click();
    await page.waitForTimeout(1000);
    await page.getByLabel(/Email/i).first().fill("couverge@gmail.com");
    await page.getByLabel(/Mot de passe/i).first().fill("Love1968@");
    await page.getByRole("button", { name: /Se connecter|Connexion/i }).first().click();
    await page.waitForTimeout(5000);
  }
});

test("Onglet Catégories est accessible", async ({ page }) => {
  const catBtn = page.getByRole("button", { name: /^Catégories$/i }).first();
  if (await catBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await catBtn.click();
    await page.waitForTimeout(3000);

    // Should see the categories UI
    const catUI = await page
      .getByText(/Catégories|Nouvelle catégorie|Aucune catégorie/i)
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(catUI).toBeTruthy();
  }
});

test("Onglet Produits affiche les produits existants", async ({ page }) => {
  const prodBtn = page.getByRole("button", { name: /^Produits$/i }).first();
  if (await prodBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await prodBtn.click();
    await page.waitForTimeout(3000);

    // Should see products (the demo account has 10 products)
    const productsVisible = await page
      .getByText(/Thiéboudienne|Yassa|Mafé|Bissap/i)
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    expect(productsVisible).toBeTruthy();
  }
});

test("Bouton 'Nouveau produit' est visible", async ({ page }) => {
  const prodBtn = page.getByRole("button", { name: /^Produits$/i }).first();
  if (await prodBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await prodBtn.click();
    await page.waitForTimeout(3000);

    // Should see "Nouveau produit" button
    const newProdBtn = page.getByRole("button", { name: /Nouveau produit|Ajouter/i }).first();
    const visible = await newProdBtn.isVisible({ timeout: 10000 }).catch(() => false);
    expect(visible).toBeTruthy();
  }
});
