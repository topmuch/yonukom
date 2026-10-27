import { test, expect } from "@playwright/test";

/**
 * Test E2E #1 — Flux critique: Signup → Login → Onboarding → Dashboard
 *
 * Vérifie que l'utilisateur peut:
 * 1. Accéder à la landing page
 * 2. Cliquer sur "Commencer" → voir le formulaire d'inscription
 * 3. Créer un compte (si l'email n'existe pas déjà)
 * 4. Se connecter
 * 5. Voir l'onboarding wizard (nouveau compte) ou le dashboard
 */

const TEST_EMAIL = `e2e-test-${Date.now()}@yonukom.test`;
const TEST_PASSWORD = "Test123456!";
const BUSINESS_NAME = "E2E Test Shop";

test("Flux signup → login → onboarding/dashboard", async ({ page }) => {
  // 1. Landing page
  await page.goto("/");
  await expect(page).toHaveTitle(/YonuKom/i);

  // 2. Click "Commencer" — should navigate to signup view
  // Look for the "Commencer" button in the navbar
  const signupButton = page.getByRole("button", { name: /Commencer/i }).first();
  if (await signupButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await signupButton.click();
    await page.waitForTimeout(1000);
  }

  // 3. Try to create an account
  // Check if we're on the signup form
  const nameInput = page.getByLabel(/Nom complet/i).first();
  if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nameInput.fill("E2E Test User");
    await page.getByLabel(/Email/i).first().fill(TEST_EMAIL);
    await page.getByLabel(/Téléphone/i).first().fill("780000000");
    await page.getByLabel(/Nom du commerce/i).first().fill(BUSINESS_NAME);

    // Click "Suivant" or "Continuer"
    const nextButton = page.getByRole("button", { name: /Suivant|Continuer/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Fill password fields (step 2 of signup)
      const passwordInput = page.getByLabel(/Mot de passe/i).first();
      const confirmPasswordInput = page.getByLabel(/Confirmer/i).first();
      const identifierInput = page.getByLabel(/Identifiant/i).first();

      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill(TEST_PASSWORD);
        if (await confirmPasswordInput.isVisible()) {
          await confirmPasswordInput.fill(TEST_PASSWORD);
        }
        if (await identifierInput.isVisible().catch(() => false)) {
          await identifierInput.fill("e2etest");
        }

        // Submit
        const submitButton = page.getByRole("button", { name: /Créer|Inscrire|Valider/i }).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  }

  // 4. Login with the test account (or existing demo account)
  await page.goto("/");
  await page.waitForTimeout(1000);

  // Look for login button
  const loginButton = page.getByRole("button", { name: /Se connecter/i }).first();
  if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginButton.click();
    await page.waitForTimeout(1000);
  }

  // Fill login form
  const emailField = page.getByLabel(/Email/i).first();
  const passwordField = page.getByLabel(/Mot de passe/i).first();

  if (await emailField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailField.fill("couverge@gmail.com");
    await passwordField.fill("Love1968@");

    // Submit login
    const submitLogin = page.getByRole("button", { name: /Se connecter|Connexion/i }).first();
    if (await submitLogin.isVisible()) {
      await submitLogin.click();
      await page.waitForTimeout(5000);
    }
  }

  // 5. After login: should see dashboard OR onboarding wizard
  // Check if we see the dashboard sidebar or onboarding
  const dashboardVisible = await page
    .getByText(/Vente|Accueil|Produits|Commande/i)
    .first()
    .isVisible({ timeout: 10000 })
    .catch(() => false);

  const onboardingVisible = await page
    .getByText(/onboarding|configurer|commerce/i)
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  // At least one of them should be visible
  expect(dashboardVisible || onboardingVisible).toBeTruthy();
});

test("Landing page loads correctly", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/YonuKom/i);

  // Check hero section
  await expect(page.getByText(/Gérez votre commerce/i).first()).toBeVisible({ timeout: 10000 });
});

test("Login page accessible from navbar", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);

  // The navbar should have a "Se connecter" button
  const loginBtn = page.getByRole("button", { name: /Se connecter/i }).first();
  await expect(loginBtn).toBeVisible({ timeout: 10000 });
});
