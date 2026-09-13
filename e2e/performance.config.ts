import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "release-performance.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.TOOLS_BASE_URL || "http://127.0.0.1:4174",
    trace: "retain-on-failure",
  },
  webServer: process.env.TOOLS_BASE_URL ? undefined : {
    command: "npm run preview",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
  },
});
