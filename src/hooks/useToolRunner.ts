import { useCallback, useEffect, useRef, useState } from "react";
import { ToolError } from "../services/errors";
import type { ToolResult } from "../services/files";
export function useToolRunner() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<(ToolResult & { url: string }) | null>(
    null,
  );
  const controller = useRef<AbortController | null>(null),
    url = useRef<string | null>(null);
  const clear = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
  }, []);
  useEffect(() => clear, [clear]);
  const reset = useCallback(() => {
    clear();
    setBusy(false);
    setError("");
    setResult(null);
  }, [clear]);
  const run = async (
    operation: (signal: AbortSignal) => Promise<ToolResult> | ToolResult,
  ) => {
    reset();
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    try {
      const value = await operation(current.signal);
      if (current.signal.aborted) return;
      const objectUrl = URL.createObjectURL(value.blob);
      url.current = objectUrl;
      setResult({ ...value, url: objectUrl });
    } catch (failure) {
      if (!current.signal.aborted)
        setError(failure instanceof ToolError ? failure.code : "failed");
    } finally {
      if (!current.signal.aborted) {
        setBusy(false);
        controller.current = null;
      }
    }
  };
  return { busy, error, result, run, reset };
}

