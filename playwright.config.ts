import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: process.env.TOOLS_BASE_URL || "http://127.0.0.1:4174",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium-tools", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.TOOLS_BASE_URL
    ? undefined
    : {
        command: "npm run preview",
        url: "http://127.0.0.1:4174",
        reuseExistingServer: !process.env.CI,
      },
});

