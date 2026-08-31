import { ToolError } from "./errors.js";
export interface ToolResult {
  blob: Blob;
  filename: string;
  pages?: number;
  originalSize?: number;
}
export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
export function runPdf(
  files: File[],
  mode: "merge-pdf" | "split-pdf",
  selection: string,
  signal: AbortSignal,
): Promise<ToolResult> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(new URL("./pdf.worker.ts", import.meta.url), {
      type: "module",
    });
    const cleanup = () => {
      worker.terminate();
      signal.removeEventListener("abort", abort);
      clearTimeout(timeout);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new ToolError("failed"));
    }, 120_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = () => {
      cleanup();
      reject(new ToolError("pdf"));
    };
    worker.onmessage = (
      event: MessageEvent<{
        error?: string;
        bytes: Uint8Array<ArrayBuffer>;
        pages: number;
      }>,
    ) => {
      cleanup();
      if (event.data.error) reject(new ToolError(event.data.error));
      else
        resolve({
          blob: new Blob([event.data.bytes], { type: "application/pdf" }),
          filename:
            mode === "merge-pdf"
              ? "nexus-merged.pdf"
              : "nexus-selected-pages.pdf",
          pages: event.data.pages,
        });
    };
    worker.postMessage({ files, mode, selection });
  });
}
export async function processImage(
  file: File | undefined,
  format: string,
  quality: number,
  maxWidth: number,
  signal: AbortSignal,
): Promise<ToolResult> {
  if (!file) throw new ToolError("files");
  if (file.size > 20 * 1024 * 1024) throw new ToolError("size");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new ToolError("image");
  if (!["image/png", "image/jpeg", "image/webp"].includes(format))
    throw new ToolError("format");
  if (
    !Number.isFinite(quality) ||
    quality < 0.1 ||
    quality > 1 ||
    !Number.isInteger(maxWidth) ||
    maxWidth < 1 ||
    maxWidth > 10000
  )
    throw new ToolError("number");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ToolError("image");
  }
  try {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    if (bitmap.width * bitmap.height > 24_000_000)
      throw new ToolError("dimensions");
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new ToolError("image");
    if (format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new ToolError("format"))),
        format,
        quality,
      ),
    );
    if (blob.type !== format) throw new ToolError("format");
    return {
      blob,
      filename: `${file.name.replace(/\.[^.]+$/, "")}-nexus.${format === "image/jpeg" ? "jpg" : format.split("/")[1]}`,
      originalSize: file.size,
    };
  } finally {
    bitmap.close();
  }
}
export async function generateQr(text: string, format = 'svg'): Promise<ToolResult> {
  if (!text.trim() || new TextEncoder().encode(text).length > 1000)
    throw new ToolError("qr");
  if (!['svg','png'].includes(format)) throw new ToolError('format');
  const { toString, toCanvas } = await import("qrcode");
  if(format==='png') {
    const canvas=document.createElement('canvas');
    await toCanvas(canvas,text,{errorCorrectionLevel:'M',margin:4,width:512});
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new ToolError('format')),'image/png'));
    return {blob,filename:'nexus-qr.png'};
  }
  const svg = await toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 4,
    width: 512,
    color: { dark: "#101010", light: "#ffffff" },
  });
  return {
    blob: new Blob([svg], { type: "image/svg+xml" }),
    filename: "nexus-qr.svg",
  };
}

