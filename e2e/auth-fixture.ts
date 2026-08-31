import { test as base, expect, type Page } from "@playwright/test";

// Provider responses are mocked in the browser only. Production has no auth bypass.
export const testUser = { id: "11111111-1111-4111-8111-111111111111", email: "test@example.com", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z", factors: [] };
export function session(aal = "aal1") {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: testUser.id, exp, aal })}.test-signature`, refresh_token: "test-refresh-token-not-a-real-credential", expires_in: 3600, expires_at: exp, token_type: "bearer", user: testUser };
}
export async function mockAccount(page: Page, signedIn = true) {
  await page.route("**/auth/v1/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/logout")) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith("/signup")) return route.fulfill({ json: testUser });
    if (url.pathname.endsWith("/user")) return route.fulfill({ json: testUser });
    return route.fulfill({ json: session() });
  });
  await page.addInitScript(({ signedIn, stored }) => {
    localStorage.setItem("nexus-language", JSON.stringify({ state: { language: "en" }, version: 0 }));
    if (signedIn && !sessionStorage.getItem("auth-fixture-initialized")) {
      localStorage.setItem("nexus-tools-session", JSON.stringify(stored));
      sessionStorage.setItem("auth-fixture-initialized", "true");
    }
  }, { signedIn, stored: session() });
}
export const test = base.extend({ page: async ({ page }, use) => { await mockAccount(page); await use(page); } });
export { expect };
