import { test, expect } from './auth-fixture.js';
for (const theme of ['dark', 'light']) {
  for (const width of [390, 1280]) {
    test(`shared theme ${theme} at ${width}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem('nexus-tools-preferences', JSON.stringify({ state: { theme: value }, version: 0 })), theme);
      await page.goto('/');
      await expect(page.locator('.tools-app')).toBeVisible();
      await expect(page.locator('body')).toHaveCSS('background-color', theme === 'dark' ? 'rgb(12, 11, 16)' : 'rgb(247, 245, 250)');
      await expect(page.locator('html')).toHaveCSS('--accent', theme === 'dark' ? '#b69aff' : '#6d28d9');
      expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Manrope');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`tools-${theme}-${width}.png`), fullPage: true });
});
  }
}
