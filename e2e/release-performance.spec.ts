import { test, expect } from "./auth-fixture.js";
import { writeFileSync } from "node:fs";
test("mobile constrained startup measurements", async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 });
  await page.addInitScript(() => {
    const result = { lcp: 0, cls: 0, longTaskMs: 0 };
    Object.assign(window, { nexusMetrics: result });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) result.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) { const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }; if (!shift.hadRecentInput) result.cls += shift.value; } }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) result.longTaskMs += Math.max(0, entry.duration - 50); }).observe({ type: "longtask", buffered: true });
  });
  const results = [];
  for (const route of ["/"]) {
    await page.goto(route);
    await expect(page.locator(".hero h1")).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const start = Date.now();
    await page.getByRole("button", { name: "Open QR Code Generator", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("textbox").last()).toBeVisible();
    const toolReadyMs = Date.now() - start;
    results.push({ route, toolReadyMs, ...await page.evaluate(() => ({ ...(window as unknown as { nexusMetrics: { lcp: number; cls: number; longTaskMs: number } }).nexusMetrics, ready: performance.now() })) });
  }
  writeFileSync(info.outputPath("mobile-performance.json"), JSON.stringify(results, null, 2));
  for (const result of results) { expect(result.lcp, result.route).toBeLessThan(4000); expect(result.cls, result.route).toBeLessThan(0.1); }
});
