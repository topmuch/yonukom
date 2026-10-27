import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for YonuKom E2E tests
 * Run: npx playwright test
 * UI mode: npx playwright test --ui
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Sequential — avoid race conditions on shared DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker for sequential execution
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "fr-FR",
    timezoneId: "Africa/Dakar",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No local webServer — we test against the deployed site (BASE_URL env)
  // To test locally: BASE_URL=http://localhost:3000 npx playwright test
  //   + start the dev server manually first
});
