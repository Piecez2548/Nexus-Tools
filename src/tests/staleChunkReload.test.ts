import { afterEach, describe, expect, it, vi } from "vitest";
import { installStaleChunkReload } from "../shared/staleChunkReload";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

function fire() {
  const event = new Event("vite:preloadError", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("stale chunk reload", () => {
  let uninstall: (() => void) | undefined;
  afterEach(() => uninstall?.());

  it("reloads once and suppresses the error when a chunk fails to load", () => {
    const reload = vi.fn();
    uninstall = installStaleChunkReload(reload, memoryStorage(), () => 1_000_000);
    expect(fire().defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not loop when the chunk is still missing after reloading", () => {
    const reload = vi.fn();
    let time = 1_000_000;
    uninstall = installStaleChunkReload(reload, memoryStorage(), () => time);
    fire();
    time += 5_000;
    expect(fire().defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
