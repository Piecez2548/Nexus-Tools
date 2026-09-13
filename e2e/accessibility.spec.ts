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
    await expect(page.locator(".tool-card")).toHaveCount(17);
    await page.addScriptTag({ content: axe });
    const violations = await page.evaluate(async () => {
      const engine = (window as unknown as { axe: { run: (options: object) => Promise<{ violations: { id: string; nodes: { target: string[]; failureSummary: string }[] }[] }> } }).axe;
      return (await engine.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, detail: n.failureSummary })) }));
    });
    expect(violations).toEqual([]);
  });
}
