import { existsSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { toolCatalog, toolFromPath, toolPath } from "../catalog";

it("gives every tool its own address and resolves it back", () => {
  const paths = toolCatalog.map((tool) => toolPath(tool.id));
  expect(new Set(paths).size).toBe(toolCatalog.length);
  for (const tool of toolCatalog) {
    expect(toolFromPath(toolPath(tool.id))?.id).toBe(tool.id);
    expect(toolFromPath(`${toolPath(tool.id)}/`)?.id).toBe(tool.id);
  }
});

it("keeps tool addresses clear of runtime asset folders and the API", () => {
  for (const tool of toolCatalog) {
    const path = toolPath(tool.id);
    expect(existsSync(`public${path}`), path).toBe(false);
    expect(path).not.toBe("/api");
  }
});

it("does not treat other paths as tools", () => {
  expect(toolFromPath("/")).toBeNull();
  expect(toolFromPath("/ocr")).toBeNull();
  expect(toolFromPath("/not-a-tool")).toBeNull();
});

it("serves real 404s and long-lived caching only for hashed assets", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  expect(config.rewrites).toBeUndefined();
  expect(config.cleanUrls).toBe(true);
  const immutable = config.headers.filter((rule: { headers: { value: string }[] }) => rule.headers.some((header) => header.value.includes("immutable")));
  expect(immutable.map((rule: { source: string }) => rule.source)).toEqual(["/assets/(.*)"]);
});
