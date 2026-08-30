import { ToolError } from "./errors";
import type { ToolResult } from "./files";
export const abortCheck = (signal: AbortSignal) => {
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
};
export async function readBitmap(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new ToolError("image");
  if (file.size > 20 * 1024 * 1024) throw new ToolError("size");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ToolError("image");
  }
  if (bitmap.width * bitmap.height > 24000000) {
    bitmap.close();
    throw new ToolError("dimensions");
  }
  return bitmap;
}
export function canvasBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob?.type === type ? resolve(blob) : reject(new ToolError("format")),
      type,
      quality,
    ),
  );
}
export interface ImageOptions {
  format: string;
  width: number;
  quality: number;
  x: number;
  y: number;
  cropWidth: number;
  cropHeight: number;
  watermark: string;
  removeBackground: boolean;
  color: string;
  tolerance: number;
}
export const defaultImageOptions: ImageOptions = {
  format: "image/png",
  width: 1920,
  quality: 0.85,
  x: 0,
  y: 0,
  cropWidth: 100,
  cropHeight: 100,
  watermark: "",
  removeBackground: false,
  color: "#ffffff",
  tolerance: 35,
};
// Remove only matching pixels connected to the canvas edge, preserving enclosed details.
export function clearBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  color: number[],
  tolerance: number,
) {
  const seen = new Uint8Array(width * height),
    queue = new Int32Array(width * height);
  let head = 0,
    tail = 0;
  const add = (i: number) => {
    if (seen[i]) return;
    seen[i] = 1;
    const k = i * 4;
    if (
      Math.max(
        Math.abs(data[k] - color[0]),
        Math.abs(data[k + 1] - color[1]),
        Math.abs(data[k + 2] - color[2]),
      ) > tolerance &&
      data[k + 3] !== 0
    )
      return;
    queue[tail++] = i;
  };
  for (let x = 0; x < width; x++) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    add(y * width);
    add(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    data[i * 4 + 3] = 0;
    const x = i % width;
    if (x > 0) add(i - 1);
    if (x < width - 1) add(i + 1);
    if (i >= width) add(i - width);
    if (i < width * (height - 1)) add(i + width);
  }
}
export async function editImage(
  file: File,
  options: ImageOptions,
  signal: AbortSignal,
): Promise<ToolResult> {
  const o = options;
  if (
    ![
      o.width,
      o.quality,
      o.x,
      o.y,
      o.cropWidth,
      o.cropHeight,
      o.tolerance,
    ].every(Number.isFinite) ||
    o.width < 1 ||
    o.width > 10000 ||
    o.quality < 0.1 ||
    o.quality > 1 ||
    o.x < 0 ||
    o.y < 0 ||
    o.cropWidth <= 0 ||
    o.cropHeight <= 0 ||
    o.x + o.cropWidth > 100 ||
    o.y + o.cropHeight > 100 ||
    o.tolerance < 0 ||
    o.tolerance > 255 ||
    !/^#[a-f\d]{6}$/i.test(o.color) ||
    o.watermark.length > 100
  )
    throw new ToolError("number");
  if (!["image/png", "image/jpeg", "image/webp"].includes(o.format))
    throw new ToolError("format");
  const bitmap = await readBitmap(file);
  try {
    abortCheck(signal);
    const sw = Math.max(1, Math.round((bitmap.width * o.cropWidth) / 100)),
      sh = Math.max(1, Math.round((bitmap.height * o.cropHeight) / 100));
    const scale = Math.min(1, o.width / sw);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    const ctx = canvas.getContext("2d", {
      willReadFrequently: o.removeBackground,
    });
    if (!ctx) throw new ToolError("image");
    if (o.format === "image/jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(
      bitmap,
      (bitmap.width * o.x) / 100,
      (bitmap.height * o.y) / 100,
      sw,
      sh,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    if (o.removeBackground) {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      clearBackground(
        pixels.data,
        canvas.width,
        canvas.height,
        [1, 3, 5].map((i) => parseInt(o.color.slice(i, i + 2), 16)),
        o.tolerance,
      );
      ctx.putImageData(pixels, 0, 0);
    }
    if (o.watermark.trim()) {
      const size = Math.max(12, Math.round(canvas.width / 25));
      ctx.font = `600 ${size}px system-ui`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#fff";
      ctx.strokeText(
        o.watermark,
        canvas.width - 12,
        canvas.height - 12,
        canvas.width - 24,
      );
      ctx.fillText(
        o.watermark,
        canvas.width - 12,
        canvas.height - 12,
        canvas.width - 24,
      );
    }
    abortCheck(signal);
    const blob = await canvasBlob(
      canvas,
      o.removeBackground ? "image/png" : o.format,
      o.quality,
    );
    return {
      blob,
      filename: `${file.name.replace(/\.[^.]+$/, "")}-nexus.${blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1]}`,
    };
  } finally {
    bitmap.close();
  }
}
export async function batchImages(
  files: File[],
  options: ImageOptions,
  signal: AbortSignal,
) {
  if (!files.length) throw new ToolError("files");
  if (
    files.length > 20 ||
    files.reduce((sum, f) => sum + f.size, 0) > 50 * 1024 * 1024
  )
    throw new ToolError("size");
  const entries: Record<string, Uint8Array> = {};
  let totalOutput = 0;
  for (let i = 0; i < files.length; i++) {
    abortCheck(signal);
    const result = await editImage(files[i], options, signal);
    totalOutput += result.blob.size;
    if (totalOutput > 100 * 1024 * 1024) throw new ToolError("size");
    entries[
      `${String(i + 1).padStart(2, "0")}-${result.filename.replace(/[^\p{L}\p{N}._-]/gu, "_")}`
    ] = new Uint8Array(await result.blob.arrayBuffer());
    await new Promise((r) => setTimeout(r, 0));
  }
  const { zip } = await import("fflate");
  const bytes = await new Promise<Uint8Array<ArrayBuffer>>(
    (resolve, reject) => {
      const cancel = zip(entries, { level: 0 }, (err, data) => {
        signal.removeEventListener("abort", abort);
        if (err) reject(err);
        else resolve(new Uint8Array(data));
      });
      const abort = () => {
        cancel();
        reject(new DOMException("Cancelled", "AbortError"));
      };
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    },
  );
  return {
    blob: new Blob([bytes], { type: "application/zip" }),
    filename: "nexus-images.zip",
  };
}
