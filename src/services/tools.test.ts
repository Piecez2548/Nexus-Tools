import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { parsePageSelection, processPdf } from "./pdf";
import { convertUnit, countText, invoiceTotals } from "./calculations";
import { createInvoice, escapeHtml } from "./invoice";
import { generateQr } from "./files";
import { filterTools } from "../catalog";

describe("PDF processing", () => {
  it("preserves explicit page order and deduplicates pages", () => {
    expect(parsePageSelection("4, 1-2, 2", 4)).toEqual([3, 0, 1]);
  });
  it.each(["", "0", "1-999999999", "4-2", "2,", "-1", "1.5", "x"])(
    "rejects invalid ranges %s",
    (value) => {
      expect(() => parsePageSelection(value, 4)).toThrow("pages");
    },
  );
  it("merges actual documents and exports selected pages in order", async () => {
    const first = await PDFDocument.create();
    first.addPage([100, 200]);
    first.addPage([200, 300]);
    const second = await PDFDocument.create();
    second.addPage([300, 400]);
    const a = new Uint8Array(await first.save()).buffer,
      b = new Uint8Array(await second.save()).buffer;
    const merged = await processPdf([a, b], "merge-pdf", "");
    const document = await PDFDocument.load(merged.bytes);
    expect(document.getPages().map((page) => page.getWidth())).toEqual([
      100, 200, 300,
    ]);
    const split = await processPdf(
      [new Uint8Array(merged.bytes).buffer],
      "split-pdf",
      "3,1",
    );
    expect(
      (await PDFDocument.load(split.bytes))
        .getPages()
        .map((page) => page.getWidth()),
    ).toEqual([300, 100]);
  });
  it("rejects malformed PDFs and insufficient merge inputs", async () => {
    await expect(processPdf([], "merge-pdf", "")).rejects.toThrow("files");
    await expect(
      processPdf([new ArrayBuffer(20)], "split-pdf", "1"),
    ).rejects.toThrow("pdf");
  });
});
describe("deterministic calculations", () => {
  it("converts imperial units and temperatures correctly", () => {
    expect(convertUnit("1", "length", "mi", "m")).toBe(1609.344);
    expect(convertUnit("1", "weight", "lb", "kg")).toBe(0.45359237);
    expect(convertUnit("32", "temperature", "F", "C")).toBe(0);
    expect(convertUnit("100", "temperature", "C", "F")).toBe(212);
  });
  it("rejects blanks, nonfinite values and physically impossible temperatures", () => {
    expect(() => convertUnit("", "length", "m", "km")).toThrow("number");
    expect(() => convertUnit("Infinity", "length", "m", "km")).toThrow(
      "number",
    );
    expect(() => convertUnit("-274", "temperature", "C", "K")).toThrow(
      "temperature",
    );
  });
  it("counts English, Thai and visible Unicode characters", () => {
    expect(countText("Hello world\n\nNext paragraph", "en")).toMatchObject({
      words: 4,
      paragraphs: 2,
    });
    expect(countText("ภาษาไทย", "th").words).toBeGreaterThan(0);
    expect(countText("👨‍👩‍👧‍👦", "en").characters).toBe(1);
    expect(countText("", "th")).toEqual({
      words: 0,
      characters: 0,
      paragraphs: 0,
      bytes: 0,
    });
  });
  it("calculates invoice money in cents and rejects invalid quantities", () => {
    expect(
      invoiceTotals(
        [{ description: "Service", quantity: "3", price: "0.10" }],
        "7",
      ),
    ).toEqual({ lines: [30], subtotal: 30, tax: 2, total: 32 });
    expect(() =>
      invoiceTotals(
        [{ description: "Service", quantity: "-1", price: "20" }],
        "7",
      ),
    ).toThrow("invoice");
    expect(() =>
      invoiceTotals(
        [{ description: "Service", quantity: "1", price: "1.999" }],
        "7",
      ),
    ).toThrow("invoice");
  });
});
describe("safe exports and catalogue", () => {
  it("escapes HTML and creates an invoice without executing customer text", () => {
    expect(escapeHtml('<script>"&')).toBe("&lt;script&gt;&quot;&amp;");
    const invoice = {
      seller: "<img src=x onerror=alert(1)>",
      customer: "ลูกค้า",
      number: "INV/001",
      date: "2026-08-30",
      currency: "THB",
      tax: "7",
      language: "th" as const,
      items: [{ description: "งาน", quantity: "1", price: "100" }],
    };
    expect(createInvoice(invoice).filename).toBe("invoice-INV_001.html");
    expect(() => createInvoice({ ...invoice, date: "2026-02-31" })).toThrow(
      "invoice",
    );
  });
  it("creates QR SVG and rejects oversized UTF-8 inputs", async () => {
    const result = await generateQr("https://example.com");
    expect(result.blob.type).toBe("image/svg+xml");
    expect(result.blob.size).toBeGreaterThan(100);
    await expect(generateQr("ก".repeat(400))).rejects.toThrow("qr");
  });
  it("searches both languages and intersects favorites with categories", () => {
    expect(
      filterTools("รวมไฟล์", "all", [], false, "recommended", "en").map(
        (tool) => tool.id,
      ),
    ).toEqual(["merge-pdf"]);
    expect(
      filterTools(
        "",
        "pdf",
        ["qr-code", "merge-pdf"],
        true,
        "recommended",
        "en",
      ).map((tool) => tool.id),
    ).toEqual(["merge-pdf"]);
  });
});

