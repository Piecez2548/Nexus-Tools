import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useToolRunner } from "./useToolRunner";
afterEach(() => vi.unstubAllGlobals());
it("cancels stale operations and revokes download URLs on close", async () => {
  const revoke = vi.fn();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:result"),
    revokeObjectURL: revoke,
  });
  const { result, unmount } = renderHook(() => useToolRunner());
  let complete!: (value: { blob: Blob; filename: string }) => void;
  act(() => {
    void result.current.run(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
  });
  act(() => result.current.reset());
  await act(async () =>
    complete({ blob: new Blob(["stale"]), filename: "old.txt" }),
  );
  expect(result.current.result).toBeNull();
  await act(async () =>
    result.current.run(() => ({ blob: new Blob(["ok"]), filename: "new.txt" })),
  );
  await waitFor(() => expect(result.current.result?.filename).toBe("new.txt"));
  unmount();
  expect(revoke).toHaveBeenCalledWith("blob:result");
});

