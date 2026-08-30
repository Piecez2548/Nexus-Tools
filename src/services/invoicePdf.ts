
import { promptPayPayload } from "./promptPay";
import { drawWatermark } from "./watermark";
import { PDFDocument } from "pdf-lib";
import { validateInvoice, type Invoice } from "./invoice";
import { abortCheck, canvasBlob } from "./imageTools";
import { ToolError } from "./errors";
import type { ToolResult } from "./files";

/** Browser text shaping preserves Thai marks; pages are embedded at print resolution. */
export async function createInvoicePdf(invoice: Invoice, signal: AbortSignal): Promise<ToolResult> {
  const totals = validateInvoice(invoice);
  const kind = invoice.kind ?? "invoice";
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
  let paymentQr: { canvas: HTMLCanvasElement; x: number; y: number } | null = null;
  const font = (bold = false, size = 23) => { ctx.font = `${bold ? 600 : 400} ${size}px system-ui, sans-serif`; };
  const text = (value: string, x: number, at: number, bold = false, size = 23, align: CanvasTextAlign = "left") => {
    font(bold, size); ctx.fillStyle = bold ? "#172b4d" : "#334155"; ctx.textAlign = align; ctx.textBaseline = "top"; ctx.fillText(value, x, at);
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
    y = 100; pageNumber++; paymentQr = null;
  };
  const save = async () => {
    abortCheck(signal);
    ctx.fillStyle = "#cbd5e1"; ctx.fillRect(left, 1628, right - left, 1);
    text(t("Prepared with Nexus Tools - not a certified tax invoice.", "จัดทำด้วย Nexus Tools เอกสารนี้ไม่ใช่ใบกำกับภาษีที่ได้รับการรับรอง"), left, 1650, false, 18);
    text(String(pageNumber), right, 1650, false, 18, "right");
    drawWatermark(ctx, canvas.width, canvas.height, invoice.watermark ?? "");
    if (paymentQr) ctx.drawImage(paymentQr.canvas, paymentQr.x, paymentQr.y, 260, 260);
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
  const rule = () => { ctx.fillStyle = "#e2e8f0"; ctx.fillRect(left, y, right - left, 1); y += 22; };
  const tableHeader = async () => {
    await ensure(90);
    ctx.fillStyle = "#f1f5f9"; ctx.fillRect(left - 12, y - 15, right - left + 24, 65);
    text(t("Description", "รายการ"), left, y, true);
    text(t("Qty", "จำนวน"), 730, y, true, 21, "right");
    text(t("Price", "ราคา"), 930, y, true, 21, "right");
    text(t("Amount", "จำนวนเงิน"), right, y, true, 21, "right");
    y += 76;
  };
  start();
  if (invoice.logo) {
    const bytes = Uint8Array.from(atob(invoice.logo.split(",")[1]), (char) => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    try {
      const scale = Math.min(220 / bitmap.width, 120 / bitmap.height);
      ctx.drawImage(bitmap, left, y, bitmap.width * scale, bitmap.height * scale);

    } finally { bitmap.close(); }
  }
  if (!invoice.logo) text("NEXUS", left, 110, true, 40);
  text({quotation:"ใบเสนอราคา",invoice:"ใบแจ้งหนี้",receipt:"ใบเสร็จรับเงิน"}[kind], right, 90, true, 52, "right");
  text({quotation:"Quotation",invoice:"Invoice",receipt:"Receipt"}[kind], right, 170, false, 30, "right");
  ctx.fillStyle = "#172b4d"; ctx.fillRect(left, 244, right - left, 2);
  y = 280;
  // Wrap reference and date safely, including unusually long invoice numbers.
  await block(`${t("Document no.", "เลขที่")} ${invoice.number}   |   ${invoice.date}`, false, 20);
  if (invoice.sourceNumber) await block(`${t("Reference", "อ้างอิง")}: ${invoice.sourceNumber}`, false, 20);
  y += 24;
  const columns = async (a: string[], b: string[]) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      await ensure(38);
      if (a[i]) text(a[i], left, y);
      if (b[i]) text(b[i], 680, y);
      y += 38;
    }
  };
  await ensure(80);
  text(t("Seller", "ผู้ขาย"), left, y, true, 26);
  text(t("Customer", "ลูกค้า"), 680, y, true, 26);
  y += 44;
  await columns(wrap(invoice.seller, 490), wrap(invoice.customer, 480));
  y += 32;
  if (invoice.title?.trim()) { await block(invoice.title, true, 32); y += 25; }
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
  await ensure(200);
  ctx.fillStyle = "#172b4d"; ctx.fillRect(left, y, right - left, 2); y += 20;
  for (const [label, value] of [
    [t("Subtotal", "รวมก่อนภาษี"), totals.subtotal],
    [`${t("Tax", "ภาษี")} (${Number(invoice.tax)}%)`, totals.tax],
    [t("Total", "รวมสุทธิ"), totals.total],
  ] as const) {
    if (label === t("Total", "รวมสุทธิ")) { ctx.fillStyle = "#f1f5f9"; ctx.fillRect(left - 12, y - 10, right - left + 24, 48); }
    text(label, left, y, true); text(money(value), right, y, true, 24, "right"); y += 52;
  }
  y += 50;
  const signatureLines = [
    t("Approved by", "ผู้อนุมัติ"), "", "____________________________", ...wrap(invoice.approver ?? "", 490),
    t("Date ______________________", "วันที่ ______________________"), "", "",
    t("Received by", "ผู้รับเอกสาร"), "", "____________________________", ...wrap(invoice.recipient ?? "", 490),
    t("Date ______________________", "วันที่ ______________________"),
  ];
  const paymentLines = [t("Payment details", "ช่องทางการชำระเงิน"), ...wrap(invoice.payment || "-", 480), "", "", t("Notes", "หมายเหตุ"), ...wrap(invoice.notes || "-", 480)];
  await ensure(Math.min(bottom - 100, Math.max(signatureLines.length, paymentLines.length) * 38));
  const paymentStart = y;
  await columns(signatureLines, paymentLines);
  if (invoice.promptPayPhone?.trim() && kind !== "receipt") {
    const qrStart = paymentStart + paymentLines.length * 38 + 16;
    const alongside = qrStart + 390 <= bottom;
    if (!alongside) await ensure(390);
    const qrX = alongside ? 680 : left;
    const qrY = alongside ? qrStart : y;
    text(`PromptPay: ${invoice.promptPayPhone}`, qrX, qrY, true, 22);
    text(money(totals.total), qrX, qrY + 30, true, 22);
    const qrCanvas = document.createElement("canvas");
    await (await import("qrcode")).default.toCanvas(qrCanvas, promptPayPayload(invoice.promptPayPhone, totals.total), { width: 520, margin: 4, errorCorrectionLevel: "M" });
    paymentQr = { canvas: qrCanvas, x: qrX, y: qrY + 60 };
    wrap(t("Check recipient and amount in your banking app.", "ตรวจชื่อผู้รับและยอดในแอปธนาคารก่อนชำระเงิน"), 480, false, 18).forEach((line,i)=>text(line,qrX,qrY+330+i*26,false,18));
  }
  await save();
  abortCheck(signal);
  return { blob: new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" }), filename: `${kind}-${invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60)}.pdf`, pages: pdf.getPageCount() };
}
