import { ToolError } from "./errors";
import { abortCheck, readBitmap } from "./imageTools";
import { pdfPreview, renderPdfPage } from "./pdfTools";
import type { Worker } from "tesseract.js";

export async function recognizeFile(
  file: File,
  language: string,
  signal: AbortSignal,
  onProgress: (value: number) => void,
) {
  if (!["eng", "tha", "eng+tha"].includes(language))
    throw new ToolError("text");
  if (!file || file.size > 20 * 1024 * 1024) throw new ToolError("size");
  abortCheck(signal);
  const { createWorker, OEM } = await import("tesseract.js");
  let worker: Worker | undefined;
  let stopped = false;
  let rejectStop: (error: Error) => void = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    rejectStop = reject;
  });
  const stop = (error: Error) => {
    stopped = true;
    void worker?.terminate();
    rejectStop(error);
  };
  const abort = () => stop(new DOMException("Cancelled", "AbortError"));
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => stop(new ToolError("failed")), 180000);
  const operation = async () => {
    abortCheck(signal);
    const created = await createWorker(language, OEM.LSTM_ONLY, {
      workerPath: "/ocr/worker.min.js",
      corePath: "/ocr",
      langPath: "/ocr",
      workerBlobURL: false,
      logger: (message) => {
        if (
          !stopped &&
          !signal.aborted &&
          message.status === "recognizing text"
        )
          onProgress(message.progress);
      },
      errorHandler: () => stop(new ToolError("failed")),
    });
    worker = created;
    if (stopped || signal.aborted) {
      await worker.terminate();
      throw new DOMException("Cancelled", "AbortError");
    }
    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      const doc = await pdfPreview(file);
      try {
        if (doc.numPages > 10) throw new ToolError("size");
        const texts: string[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          abortCheck(signal);
          if (stopped) throw new ToolError("failed");
          const canvas = await renderPdfPage(doc, n, 1.5);
          const result = await Promise.race([
            worker.recognize(canvas),
            interrupted,
          ]);
          texts.push(`--- ${n} ---\n${result.data.text}`);
        }
        return texts.join("\n\n");
      } finally {
        await doc.destroy();
      }
    }
    const bitmap = await readBitmap(file);
    bitmap.close();
    return (await worker.recognize(file)).data.text;
  };
  try {
    return await Promise.race([operation(), interrupted]);
  } finally {
    stopped = true;
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
    await worker?.terminate();
  }
}
