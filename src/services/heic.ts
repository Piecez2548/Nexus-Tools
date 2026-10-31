import { ToolError } from "./errors";
import { abortCheck, canvasBlob, zipEntries } from "./imageTools";
import type { ToolResult } from "./files";

const maxFileBytes = 30 * 1024 * 1024;
const brands = ["heic", "heix", "heim", "heis", "mif1", "msf1", "hevc", "hevx"];

/** HEIC files carry no reliable MIME type in browsers, so check the file header instead. */
export function looksLikeHeic(bytes: Uint8Array) {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  return bytes.length > 16 && text(4, 8) === "ftyp" && brands.some((brand) => text(8, Math.min(bytes.length, 64)).includes(brand));
}

async function decodeToCanvas(bytes: Uint8Array) {
  const { default: libheif } = await import("libheif-js/wasm-bundle");
  let image;
  try {
    image = new libheif.HeifDecoder().decode(bytes)[0];
  } catch {
    throw new ToolError("heic");
  }
  if (!image) throw new ToolError("heic");
  const width = image.get_width(),
    height = image.get_height();
  if (width * height > 24_000_000) throw new ToolError("dimensions");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  const pixels = context.createImageData(width, height);
  const shown = await new Promise<ImageData | null>((resolve) => image.display(pixels, resolve));
  if (!shown) throw new ToolError("heic");
  // JPEG has no transparency, so paint the photo on white.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  layer.getContext("2d")!.putImageData(shown, 0, 0);
  context.drawImage(layer, 0, 0);
  return canvas;
}

/** Converts HEIC/HEIF photos to JPEG: one file for one photo, otherwise a ZIP. */
export async function heicToJpeg(files: File[], quality: number, signal: AbortSignal): Promise<ToolResult> {
  if (!files.length) throw new ToolError("files");
  if (files.length > 20 || files.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024 || files.some((file) => file.size > maxFileBytes))
    throw new ToolError("size");
  if (!(quality >= 0.5 && quality <= 1)) throw new ToolError("number");
  const entries: Record<string, Uint8Array> = {};
  let total = 0;
  for (const [index, file] of files.entries()) {
    abortCheck(signal);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!looksLikeHeic(bytes)) throw new ToolError("heic");
    const canvas = await decodeToCanvas(bytes);
    const jpeg = new Uint8Array(await (await canvasBlob(canvas, "image/jpeg", quality)).arrayBuffer());
    canvas.width = canvas.height = 0;
    total += jpeg.byteLength;
    if (total > 100 * 1024 * 1024) throw new ToolError("size");
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}._-]/gu, "_") || "photo";
    let name = `${base}.jpg`;
    if (entries[name]) name = `${base}-${index + 1}.jpg`;
    entries[name] = jpeg;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const names = Object.keys(entries);
  if (names.length === 1) return { blob: new Blob([new Uint8Array(entries[names[0]])], { type: "image/jpeg" }), filename: names[0] };
  const bytes = await zipEntries(entries, signal);
  return { blob: new Blob([bytes], { type: "application/zip" }), filename: "nexus-heic-to-jpg.zip" };
}
