import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  // Remote deployments may need to fetch a cold PDF/OCR chunk before showing results.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: process.env.TOOLS_BASE_URL || "http://127.0.0.1:4174",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium-tools", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-tools", testIgnore: /media-live/, use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-tools", testIgnore: /media-live/, use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", grep: /mobile menu|mobile file|backup restore|account sign/, testIgnore: /media-live/, use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", grep: /mobile menu|mobile file|backup restore|account sign/, testIgnore: /media-live/, use: { ...devices["iPhone 13"] } },
  ],
  webServer: process.env.TOOLS_BASE_URL
    ? undefined
    : {
        command: "npm run preview",
        url: "http://127.0.0.1:4174",
        reuseExistingServer: !process.env.CI,
      },
});

