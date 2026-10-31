import jsQR from "jsqr";
import { ToolError } from "./errors";
import { readBitmap } from "./imageTools";

export interface QrReading {
  text: string;
  // Only web links are offered as links; everything else stays plain text.
  link: string | null;
}

export const qrLink = (text: string) => {
  try {
    const url = new URL(text.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

const maxSide = 2000;

/** Reads the first QR code found in an image file. Throws "qrread" when none is found. */
export async function readQrCode(file: File): Promise<QrReading> {
  const bitmap = await readBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new ToolError("failed");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const found = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" });
    if (!found?.data) throw new ToolError("qrread");
    return { text: found.data, link: qrLink(found.data) };
  } finally {
    bitmap.close();
  }
}
