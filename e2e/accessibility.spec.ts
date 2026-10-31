import { test, expect } from "./auth-fixture.js";
import { readFileSync } from "node:fs";
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
// axe is test-only inline code. Keep the production CSP strict while allowing
// Playwright's isolated audit context to inject the scanner.
test.use({ bypassCSP: true });
for (const theme of ["dark", "light", "mono"]) {
  test(`catalogue accessibility ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(theme => localStorage.setItem("nexus-tools-preferences", JSON.stringify({ state: { theme }, version: 0 })), theme);
    await page.goto("/");
    await expect(page.locator(".tool-card")).toHaveCount(28);
    await page.addScriptTag({ content: axe });
    const violations = await page.evaluate(async () => {
      const engine = (window as unknown as { axe: { run: (options: object) => Promise<{ violations: { id: string; nodes: { target: string[]; failureSummary: string }[] }[] }> } }).axe;
      return (await engine.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, detail: n.failureSummary })) }));
    });
    expect(violations).toEqual([]);
  });
}

for (const theme of ["dark", "light", "mono"]) {
test(`every tool dialog passes the accessibility scan in the ${theme} theme`, async ({ page, request, browserName }) => {
  // One browser is enough to check the colours of the other themes.
  test.skip(theme !== "dark" && browserName !== "chromium", "colour themes are checked in Chromium only");
  test.setTimeout(180_000);
  await page.addInitScript(theme => localStorage.setItem("nexus-tools-preferences", JSON.stringify({ state: { theme }, version: 0 })), theme);
  await page.setViewportSize({ width: 390, height: 900 });
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname).filter(path => path !== "/");
  expect(paths.length).toBe(28);
  const found: Record<string, unknown> = {};
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole("dialog")).toBeVisible();
    // Wait for the lazy tool to replace its loading message.
    await expect(page.getByRole("dialog").locator("[role=status]", { hasText: /Loading tool|กำลังโหลดเครื่องมือ/ })).toHaveCount(0);
    await page.addScriptTag({ content: axe });
    const violations = await page.evaluate(async () => {
      const engine = (window as unknown as { axe: { run: (context: string, options: object) => Promise<{ violations: { id: string; nodes: { target: string[]; failureSummary: string }[] }[] }> } }).axe;
      return (await engine.run(".workspace", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, detail: n.failureSummary })) }));
    });
    if (violations.length) found[path] = violations;
  }
  expect(found).toEqual({});
});
}
