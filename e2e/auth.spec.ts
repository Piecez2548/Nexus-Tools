import { test, expect } from "@playwright/test";
import { mockAccount, session } from "./auth-fixture.js";

test("account sign in gate, rejection, successful login and logout", async ({ page }, info) => {
  await mockAccount(page, false);
  await page.goto("/");
  await expect(page.locator(".tool-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("sign-in.png"), fullPage: true });
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.route("**/auth/v1/token**", route => route.fulfill({ status: 400, json: { error_code: "invalid_credentials", msg: "Invalid login credentials" } }));
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to complete");
  await expect(page.locator(".tool-card")).toHaveCount(0);
  await page.unroute("**/auth/v1/token**");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".tool-card")).toHaveCount(17);
  await page.reload();
  await expect(page.locator(".tool-card")).toHaveCount(17);
  await page.getByText("Nexus account / Cloud sync", { exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.locator(".tool-card")).toHaveCount(0);
});

test("account sign in cannot skip an enrolled MFA factor", async ({ page }) => {
  await mockAccount(page);
  const user = { ...session().user, factors: [{ id: "factor-id", factor_type: "totp", status: "verified", friendly_name: "Authenticator" }] };
  let verified = false;
  await page.route("**/auth/v1/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/challenge")) return route.fulfill({ json: { id: "challenge-id", expires_at: 9999999999 } });
    if (path.endsWith("/verify")) { verified = true; return route.fulfill({ json: { ...session("aal2"), user } }); }
    return route.fulfill({ json: path.endsWith("/user") ? user : { ...session(verified ? "aal2" : "aal1"), user } });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Two-factor verification" })).toBeVisible();
  await expect(page.locator(".tool-card")).toHaveCount(0);
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await expect(page.locator(".tool-card")).toHaveCount(17);
});

test("account sign up requires email verification before tools mount", async ({ page }) => {
  await mockAccount(page, false);
  await page.goto("/");
  await page.getByRole("button", { name: "New here? Create an account" }).click();
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-only");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
  await expect(page.locator(".tool-card")).toHaveCount(0);
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Verify", exact: true }).click();
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
  expect(child.url()).not.toContain("nexus_sso");
  expect(child.url()).not.toContain("token");
  expect(await child.evaluate(() => window.opener === null)).toBe(true);
});
