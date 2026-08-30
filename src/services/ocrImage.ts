import { ToolError } from "./errors";
export interface OcrOptions {
  background: "auto" | "dark" | "light" | "original";
  crop: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}
export const defaultOcrOptions: OcrOptions = { background: "auto", crop: false, x: 0, y: 0, width: 100, height: 100 };
/** Prepare legible black-on-white text without inventing or correcting words. */
export function prepareOcrImage(source: CanvasImageSource, width: number, height: number, options: OcrOptions) {
  const { x, y, width: w, height: h } = options.crop ? options : { x: 0, y: 0, width: 100, height: 100 };
  if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > 100 || y + h > 100) throw new ToolError("image");
  const sw = width * w / 100, sh = height * h / 100;
  const scale = Math.min(options.background === "original" ? 1 : 3, 4000 / Math.max(sw, sh), Math.sqrt(12000000 / (sw * sh)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ToolError("image");
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, width * x / 100, height * y / 100, sw, sh, 0, 0, canvas.width, canvas.height);
  if (options.background !== "original") {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const histogram = new Uint32Array(256);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const gray = Math.round(pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114);
      histogram[gray]++; pixels.data[i] = gray;
    }
    const total = canvas.width * canvas.height;
    let count = 0, median = 255;
    for (let i = 0; i < 256; i++) { count += histogram[i]; if (count >= total / 2) { median = i; break; } }
    const invert = options.background === "dark" || (options.background === "auto" && median < 128);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const gray = invert ? 255 - pixels.data[i] : pixels.data[i];
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = gray;
    }
    ctx.putImageData(pixels, 0, 0);
  }
  const padded = document.createElement("canvas");
  padded.width = canvas.width + 48; padded.height = canvas.height + 48;
  const out = padded.getContext("2d")!;
  out.fillStyle = "white"; out.fillRect(0, 0, padded.width, padded.height);
  out.drawImage(canvas, 24, 24);
  return padded;
}

/** Opt-in spacing cleanup only; can also remove intentional Thai word spaces. */
export const compactThaiSpacing = (text: string) => text.replace(/(?<=[\u0E00-\u0E7F]) +(?=[\u0E00-\u0E7F])/gu, "");
