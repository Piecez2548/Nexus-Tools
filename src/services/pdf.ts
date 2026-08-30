import { PDFDocument } from "pdf-lib";
import { ToolError } from "./errors";
export function parsePageSelection(input: string, pageCount: number): number[] {
  if (!input.trim() || input.length > 2000) throw new ToolError("pages");
  const selected = new Set<number>();
  for (const part of input.split(",")) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new ToolError("pages");
    const start = Number(match[1]),
      end = Number(match[2] ?? start);
    if (start < 1 || end < start || end > pageCount)
      throw new ToolError("pages");
    for (let page = start; page <= end; page++) selected.add(page - 1);
  }
  return [...selected];
}
export async function processPdf(
  buffers: ArrayBuffer[],
  mode: "merge-pdf" | "split-pdf",
  selection: string,
) {
  if (mode === "merge-pdf" ? buffers.length < 2 : buffers.length !== 1)
    throw new ToolError("files");
  if (
    buffers.length > 20 ||
    buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0) >
      50 * 1024 * 1024
  )
    throw new ToolError("size");
  const output = await PDFDocument.create();
  let total = 0;
  for (const buffer of buffers) {
    let source: PDFDocument;
    try {
      source = await PDFDocument.load(buffer, { updateMetadata: false });
    } catch {
      throw new ToolError("pdf");
    }
    total += source.getPageCount();
    if (total > 500) throw new ToolError("size");
    // Preserve form appearances when copying pages; editable fields cannot be retained.
    try {
      const form = source.getForm();
      if (form.getFields().length) form.flatten();
    } catch {
      throw new ToolError("pdf");
    }
    const indices =
      mode === "split-pdf"
        ? parsePageSelection(selection, source.getPageCount())
        : source.getPageIndices();
    for (const page of await output.copyPages(source, indices))
      output.addPage(page);
  }
  if (!output.getPageCount()) throw new ToolError("pdf");
  return { bytes: await output.save(), pages: output.getPageCount() };
}

