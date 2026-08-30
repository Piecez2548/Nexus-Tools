import { PDFDocument } from "pdf-lib";
import { validateInvoice, type Invoice } from "./invoice";
import { abortCheck, canvasBlob } from "./imageTools";
import { ToolError } from "./errors";
import type { ToolResult } from "./files";

/** Browser text shaping preserves Thai marks; pages are embedded at print resolution. */
export async function createInvoicePdf(invoice: Invoice, signal: AbortSignal): Promise<ToolResult> {
  const totals = validateInvoice(invoice);
  abortCheck(signal);
  await document.fonts.ready;
  const pdf = await PDFDocument.create();
  pdf.setTitle(invoice.number);
  pdf.setCreator("Nexus Tools");
  const t = (en: string, th: string) => invoice.language === "th" ? th : en;
  const money = (cents: number) => new Intl.NumberFormat(invoice.language, { style: "currency", currency: invoice.currency }).format(cents / 100);
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ToolError("failed");
  const left = 80, right = 1160, bottom = 1600;
  let y = 100, pageNumber = 0;
  const font = (bold = false, size = 23) => { ctx.font = `${bold ? 600 : 400} ${size}px system-ui, sans-serif`; };
  const text = (value: string, x: number, at: number, bold = false, size = 23, align: CanvasTextAlign = "left") => {
    font(bold, size); ctx.fillStyle = "#202a25"; ctx.textAlign = align; ctx.textBaseline = "top"; ctx.fillText(value, x, at);
  };
  const wrap = (value: string, width: number, bold = false, size = 23) => {
    font(bold, size);
    const lines: string[] = [];
    for (const paragraph of value.replace(/\r\n?/g, "\n").split("\n")) {
      let line = "";
      for (const { segment } of new Intl.Segmenter(invoice.language, { granularity: "grapheme" }).segment(paragraph)) {
        if (line && ctx.measureText(line + segment).width > width) { lines.push(line); line = ""; }
        line += segment;
      }
      lines.push(line);
    }
    return lines;
  };
  const start = () => {
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    y = 100; pageNumber++;
  };
  const save = async () => {
    abortCheck(signal);
    text(t("Prepared with Nexus Tools - not a certified tax invoice.", "จัดทำด้วย Nexus Tools เอกสารนี้ไม่ใช่ใบกำกับภาษีที่ได้รับการรับรอง"), left, 1650, false, 18);
    text(String(pageNumber), right, 1650, false, 18, "right");
    const image = await pdf.embedPng(await (await canvasBlob(canvas)).arrayBuffer());
    pdf.addPage([595.28, 841.89]).drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  const ensure = async (height: number) => { if (y + height > bottom) { await save(); start(); } };
  const block = async (value: string, bold = false, size = 23) => {
    for (const line of wrap(value, right - left, bold, size)) {
      await ensure(size + 16); text(line, left, y, bold, size); y += size + 16;
    }
  };
  const rule = () => { ctx.fillStyle = "#ccd5c7"; ctx.fillRect(left, y, right - left, 2); y += 22; };
  const tableHeader = async () => {
    await ensure(50);
    text(t("Description", "รายการ"), left, y, true);
    text(t("Qty", "จำนวน"), 730, y, true, 21, "right");
    text(t("Price", "ราคา"), 930, y, true, 21, "right");
    text(t("Amount", "จำนวนเงิน"), right, y, true, 21, "right");
    y += 42;
  };
  start();
  if (invoice.logo) {
    const bitmap = await createImageBitmap(await (await fetch(invoice.logo, { signal })).blob());
    try {
      const scale = Math.min(220 / bitmap.width, 120 / bitmap.height);
      ctx.drawImage(bitmap, left, y, bitmap.width * scale, bitmap.height * scale);
      y += bitmap.height * scale + 25;
    } finally { bitmap.close(); }
  }
  await block(t("INVOICE", "ใบแจ้งหนี้"), true, 42);
  await block(invoice.number, true);
  await block(invoice.date);
  y += 12;
  await block(t("Seller / business", "ผู้ขาย / ธุรกิจ"), true);
  await block(invoice.seller);
  y += 16; await ensure(22); rule();
  await block(t("Bill to", "ลูกค้า"), true);
  await block(invoice.customer);
  y += 24;
  await tableHeader();
  for (const [index, item] of invoice.items.entries()) {
    const lines = wrap(item.description, 540);
    const height = lines.length * 36 + 20;
    if (y + height > bottom) { await save(); start(); await tableHeader(); }
    for (const [lineIndex, line] of lines.entries()) {
      if (y + 36 > bottom) { await save(); start(); await tableHeader(); }
      text(line, left, y);
      if (lineIndex === 0) {
        text(String(Number(item.quantity)), 730, y, false, 20, "right");
        text(money(Math.round(Number(item.price) * 100)), 930, y, false, 20, "right");
        text(money(totals.lines[index]), right, y, false, 20, "right");
      }
      y += 36;
    }
    y += 6; rule();
  }
  await ensure(180);
  for (const [label, value] of [
    [t("Subtotal", "รวมก่อนภาษี"), totals.subtotal],
    [`${t("Tax", "ภาษี")} (${Number(invoice.tax)}%)`, totals.tax],
    [t("Total", "รวมสุทธิ"), totals.total],
  ] as const) {
    text(label, left, y, true); text(money(value), right, y, true, 24, "right"); y += 52;
  }
  await save();
  abortCheck(signal);
  return { blob: new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" }), filename: `invoice-${invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60)}.pdf`, pages: pdf.getPageCount() };
}
