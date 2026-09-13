import { test, expect } from "@playwright/test";
import { mockAccount, session } from "./auth-fixture.js";
const all = "https://nexus-lemon-eight-32.vercel.app/projects";

for (const suffix of ["/", "/?from=all", "/?nexus_sso=" + "a".repeat(64)]) {
  test(`direct Tools entry ${suffix} opens public tools without login`, async ({ page }) => {
    await mockAccount(page, false);
    await page.route(all, route => route.fulfill({ contentType: "text/html", body: "<h1>Nexus All sign in</h1>" }));
    await page.goto(suffix);
    await expect(page.locator(".tool-card")).toHaveCount(17);
    await expect(page.getByRole("button", { name: "Sync business data", exact: true })).toHaveCount(0);
  });
}

test("account sign in cannot skip an enrolled MFA factor", async ({ page }) => {
  await mockAccount(page);
  const user = { ...session().user, factors: [{ id: "factor-id", factor_type: "totp", status: "verified" }] };
  await page.route("**/auth/v1/**", route => route.fulfill({ json: route.request().url().endsWith("/user") ? user : { ...session("aal1"), user } }));
  await page.route(all, route => route.fulfill({ contentType: "text/html", body: "<h1>Nexus All sign in</h1>" }));
  await page.goto("/");
  await expect(page.locator(".tool-card")).toHaveCount(17);
  await page.getByText("Nexus account / Cloud sync", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Two-factor verification" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sync business data", exact: true })).toHaveCount(0);
});

test("verified account signs out while public tools remain usable", async ({ page }) => {
  await mockAccount(page);
  await page.route(all, route => route.fulfill({ contentType: "text/html", body: "<h1>Nexus All sign in</h1>" }));
  await page.goto("/");
  await expect(page.locator(".tool-card")).toHaveCount(17);
  await page.getByText("Nexus account / Cloud sync", { exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.locator(".tool-card")).toHaveCount(17);
});

test("account sign in from Nexus hands off session without credentials in URL", async ({ page, context, baseURL }) => {
  const origin = "https://nexus-lemon-eight-32.vercel.app";
  await page.route(`${origin}/**`, route => route.fulfill({ contentType: "text/html", body: '<button id="launch">Tools</button>' }));
  await page.goto(origin);
  await page.evaluate(({ baseURL, stored }) => {
    document.querySelector("button")!.addEventListener("click", () => {
      const nonce = "a".repeat(64);
      const child = window.open(`${baseURL}/?nexus_sso=${nonce}`);
      window.addEventListener("message", event => {
        if (event.source === child && event.origin === new URL(baseURL!).origin && event.data?.type === "nexus:ready") child!.postMessage({ type: "nexus:session", nonce, ...stored }, new URL(baseURL!).origin);
      });
    });
  }, { baseURL, stored: session() });
  // Install provider mock before the popup's script runs.
  await context.route("**/auth/v1/**", route => route.fulfill({ json: route.request().url().endsWith("/user") ? session().user : session() }));
  const opened = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  const child = await opened;
  await expect(child.locator(".tool-card")).toHaveCount(17);
  await expect.poll(() => child.evaluate(() => location.href)).not.toContain("nexus_sso");
  await expect.poll(() => child.evaluate(() => location.href)).not.toContain("token");
  await expect.poll(() => child.evaluate(() => window.opener === null)).toBe(true);
});
