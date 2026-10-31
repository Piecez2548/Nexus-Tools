import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nexus-language", JSON.stringify({ state: { language: "en" }, version: 0 })));
});

test("pages and tools opened before keep working offline", async ({ page, context, browserName }) => {
  // Playwright's WebKit fails the reload itself when offline emulation meets a service worker.
  test.skip(browserName === "webkit", "offline emulation with a service worker is not supported in Playwright WebKit");
  await page.goto("/");
  await expect(page.locator(".hero h1")).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  // A second visit, now under the worker, is what fills the cache with everything the page loads.
  await page.reload();
  await expect(page.locator(".hero h1")).toBeVisible();
  // Open a tool online so its code is cached.
  await page.getByRole("link", { name: "Open Word Counter", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("textbox").first()).toBeVisible();
  await page.getByRole("button", { name: "Close tool" }).click();

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".hero h1")).toBeVisible();
  await page.goto("/word-counter");
  const box = page.getByRole("dialog").getByRole("textbox").first();
  await expect(box).toBeVisible();
  await box.fill("one two three");
  await expect(page.getByRole("dialog").getByText("3", { exact: true }).first()).toBeVisible();
  await context.setOffline(false);
});

test("a new deploy is not hidden by the cache: pages come from the network first", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  // Leave an old copy of the home page in the cache, as an earlier deploy would have.
  await page.evaluate(async () => {
    const cache = await caches.open("nexus-pages-v1");
    await cache.put("/", new Response("<!doctype html><title>stale copy</title>", { headers: { "content-type": "text/html" } }));
  });
  await page.goto("/");
  await expect(page).not.toHaveTitle("stale copy");
  await expect(page.locator(".hero h1")).toBeVisible();
});
