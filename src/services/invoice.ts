import { invoiceTotals, type InvoiceItem } from "./calculations";
import { ToolError } from "./errors";
import type { ToolResult } from "./files";
export interface Invoice {
  seller: string;
  customer: string;
  number: string;
  date: string;
  currency: string;
  tax: string;
  items: InvoiceItem[];
  language: "en" | "th";
}
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function createInvoice(invoice: Invoice): ToolResult {
  if (
    ![invoice.seller, invoice.customer, invoice.number].every(
      (value) => value.trim() && value.length <= 2000,
    ) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(invoice.date) ||
    !["THB", "USD", "EUR"].includes(invoice.currency)
  )
    throw new ToolError("invoice");
  const parsed = new Date(`${invoice.date}T12:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== invoice.date
  )
    throw new ToolError("invoice");
  const totals = invoiceTotals(invoice.items, invoice.tax);
  const t = (en: string, th: string) => (invoice.language === "th" ? th : en);
  const money = (value: number) =>
    new Intl.NumberFormat(invoice.language, {
      style: "currency",
      currency: invoice.currency,
    }).format(value / 100);
  const html = `<!doctype html><html lang="${invoice.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(invoice.number)} — Nexus Tools</title><style>body{font:15px/1.7 system-ui,sans-serif;color:#202a25;margin:40px auto;padding:24px;max-width:850px}header{display:flex;justify-content:space-between;border-bottom:3px solid #597442;padding-bottom:20px}h1{font-size:30px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin:30px 0;table-layout:fixed}th,td{text-align:right;padding:12px 8px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}th:first-child,td:first-child{text-align:left;width:45%}tfoot{font-weight:600}td{vertical-align:top}aside{background:#eff4e9;padding:12px;font-size:13px}footer{color:#667;font-size:12px;margin-top:35px}@media print{aside{display:none}body{margin:0;padding:0}tr{break-inside:avoid}thead{display:table-header-group}tfoot{display:table-row-group}}</style></head><body><aside>${t("Use your browser’s Print command (Ctrl/Cmd+P) and choose Save as PDF.", "ใช้คำสั่งพิมพ์ของเบราว์เซอร์ (Ctrl/Cmd+P) แล้วเลือกบันทึกเป็น PDF")}</aside><header><div><h1>${t("INVOICE", "ใบแจ้งหนี้")}</h1><pre>${escapeHtml(invoice.seller)}</pre></div><div><strong>${escapeHtml(invoice.number)}</strong><p>${invoice.date}</p></div></header><p>${t("Bill to", "ลูกค้า")}</p><pre>${escapeHtml(invoice.customer)}</pre><table><thead><tr><th>${t("Description", "รายการ")}</th><th>${t("Qty", "จำนวน")}</th><th>${t("Price", "ราคา")}</th><th>${t("Amount", "จำนวนเงิน")}</th></tr></thead><tbody>${invoice.items.map((item, index) => `<tr><td>${escapeHtml(item.description)}</td><td>${Number(item.quantity)}</td><td>${money(Math.round(Number(item.price) * 100))}</td><td>${money(totals.lines[index])}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="3">${t("Subtotal", "รวมก่อนภาษี")}</td><td>${money(totals.subtotal)}</td></tr><tr><td colspan="3">${t("Tax", "ภาษี")} (${Number(invoice.tax)}%)</td><td>${money(totals.tax)}</td></tr><tr><td colspan="3">${t("Total", "รวมสุทธิ")}</td><td>${money(totals.total)}</td></tr></tfoot></table><footer>${t("Prepared with Nexus Tools. This document is not a certified tax invoice.", "จัดทำด้วย Nexus Tools เอกสารนี้ไม่ใช่ใบกำกับภาษีที่ได้รับการรับรอง")}</footer></body></html>`;
  return {
    blob: new Blob([html], { type: "text/html;charset=utf-8" }),
    filename: `invoice-${invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60)}.html`,
  };
}

