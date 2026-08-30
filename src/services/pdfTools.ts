import { drawWatermark } from "./watermark";
import { PDFDocument, degrees } from "pdf-lib";
import { ToolError } from "./errors";
import { abortCheck, canvasBlob, readBitmap } from "./imageTools";
import type { ToolResult } from "./files";
export interface PdfPageEdit {
  index: number;
  rotation: number;
}
export interface PdfTextEdit {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  size: number;
}
export async function pdfPreview(file: File) {
  if (!file || file.size > 50 * 1024 * 1024) throw new ToolError("size");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useSystemFonts: true,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    wasmUrl: "/pdfjs/wasm/",
  });
  try {
    const doc = await task.promise;
    if (doc.numPages > 100) {
      await task.destroy();
      throw new ToolError("size");
    }
    return Object.assign(doc, { destroy: () => task.destroy() });
  } catch {
    await task.destroy();
    throw new ToolError("pdf");
  }
}
export type PreviewDocument = Awaited<ReturnType<typeof pdfPreview>>;
export async function renderPdfPage(
  doc: PreviewDocument,
  pageNumber: number,
  scale = 1,
  rotation = 0,
) {
  const page = await doc.getPage(pageNumber);
  let viewport = page.getViewport({
    scale,
    rotation: (page.rotate + rotation) % 360,
  });
  if (viewport.width * viewport.height > 12000000)
    viewport = page.getViewport({
      scale: scale * Math.sqrt(12000000 / (viewport.width * viewport.height)),
      rotation: (page.rotate + rotation) % 360,
    });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport }).promise;
  return canvas;
}
export async function imagesToPdf(
  files: File[],
  signal: AbortSignal,
): Promise<ToolResult> {
  if (!files.length) throw new ToolError("files");
  if (
    files.length > 20 ||
    files.reduce((s, f) => s + f.size, 0) > 50 * 1024 * 1024
  )
    throw new ToolError("size");
  const output = await PDFDocument.create();
  for (const file of files) {
    abortCheck(signal);
    const bitmap = await readBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const image = await output.embedJpg(
        await (await canvasBlob(canvas, "image/jpeg", 0.9)).arrayBuffer(),
      );
      const landscape = canvas.width > canvas.height;
      const w = landscape ? 841.89 : 595.28,
        h = landscape ? 595.28 : 841.89;
      const p = output.addPage([w, h]);
      const fit = Math.min((w - 40) / image.width, (h - 40) / image.height);
      p.drawImage(image, {
        x: (w - image.width * fit) / 2,
        y: (h - image.height * fit) / 2,
        width: image.width * fit,
        height: image.height * fit,
      });
    } finally {
      bitmap.close();
    }
  }
  abortCheck(signal);
  return {
    blob: new Blob([new Uint8Array(await output.save())], {
      type: "application/pdf",
    }),
    filename: "nexus-images.pdf",
    pages: files.length,
  };
}
export async function editPdf(
  file: File,
  order: PdfPageEdit[],
  watermark: string,
  edits: PdfTextEdit[],
  signal: AbortSignal,
): Promise<ToolResult> {
  if (
    file.size > 50 * 1024 * 1024 ||
    watermark.length > 100 ||
    edits.length > 100
  )
    throw new ToolError("size");
  if (!order.length) throw new ToolError("pages");
  const source = await PDFDocument.load(await file.arrayBuffer());
  if (source.getPageCount() > 100) throw new ToolError("size");
  if (
    order.some(
      (p) =>
        !Number.isInteger(p.index) ||
        p.index < 0 ||
        p.index >= source.getPageCount() ||
        ![0, 90, 180, 270].includes(p.rotation),
    )
  )
    throw new ToolError("pages");
  if (
    edits.some(
      (e) =>
        ![e.x, e.y, e.width, e.height, e.size].every(Number.isFinite) ||
        e.x < 0 ||
        e.y < 0 ||
        e.width <= 0 ||
        e.height <= 0 ||
        e.x + e.width > 100 ||
        e.y + e.height > 100 ||
        e.size < 4 ||
        e.size > 200 ||
        e.text.length > 2000,
    )
  )
    throw new ToolError("number");
  source.getForm().flatten();
  const output = await PDFDocument.create();
  let preview: PreviewDocument | undefined;
  try {
    for (const item of order) {
      abortCheck(signal);
      const replacements = edits.filter((e) => e.page === item.index);
      let page;
      if (replacements.length) {
        preview ??= await pdfPreview(file);
        const sourcePage = await preview.getPage(item.index + 1);
        const pageViewport = sourcePage.getViewport({ scale: 1 });
        const canvas = await renderPdfPage(preview, item.index + 1, 1.5);
        const renderScale = canvas.width / pageViewport.width;
        const ctx = canvas.getContext("2d")!;
        for (const e of replacements) {
          const x = (canvas.width * e.x) / 100,
            y = (canvas.height * e.y) / 100,
            w = (canvas.width * e.width) / 100,
            h = (canvas.height * e.height) / 100;
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, y, w, h);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.fillStyle = "#111";
          ctx.font = `${e.size * renderScale}px system-ui`;
          ctx.textBaseline = "top";
          e.text
            .split("\n")
            .forEach((line, i) =>
              ctx.fillText(line, x, y + i * e.size * renderScale * 1.2, w),
            );
          ctx.restore();
        }
        const img = await output.embedPng(
          await (await canvasBlob(canvas)).arrayBuffer(),
        );
        page = output.addPage([pageViewport.width, pageViewport.height]);
        page.drawImage(img, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        });
        page.setRotation(degrees(item.rotation));
      } else {
        [page] = await output.copyPages(source, [item.index]);
        output.addPage(page);
        page.setRotation(
          degrees((page.getRotation().angle + item.rotation) % 360),
        );
      }
      if (watermark.trim()) {
        const c = document.createElement("canvas");
        const scale = Math.min(2, 2000 / Math.max(page.getWidth(), page.getHeight()));
        c.width = Math.max(1, Math.round(page.getWidth() * scale));
        c.height = Math.max(1, Math.round(page.getHeight() * scale));
        const ctx = c.getContext("2d")!;
        drawWatermark(ctx, c.width, c.height, watermark);
        const img = await output.embedPng(
          await (await canvasBlob(c)).arrayBuffer(),
        );
        page.drawImage(img, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        });
      }
      await new Promise((r) => setTimeout(r, 0));
    }
    abortCheck(signal);
    return {
      blob: new Blob([new Uint8Array(await output.save())], {
        type: "application/pdf",
      }),
      filename: "nexus-edited.pdf",
      pages: output.getPageCount(),
    };
  } finally {
    await preview?.destroy();
  }
}
