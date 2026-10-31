import { describe, expect, it } from "vitest";
import { bahtText, checkThaiId, convertYear, describeDate, formatSatang, incomeTax, vatBreakdown, withholdingTax } from "./thaiTools";

describe("baht text", () => {
  it.each([
    ["0", "ศูนย์บาทถ้วน"],
    ["1", "หนึ่งบาทถ้วน"],
    ["10", "สิบบาทถ้วน"],
    ["11", "สิบเอ็ดบาทถ้วน"],
    ["20", "ยี่สิบบาทถ้วน"],
    ["21", "ยี่สิบเอ็ดบาทถ้วน"],
    ["101", "หนึ่งร้อยเอ็ดบาทถ้วน"],
    ["1,001", "หนึ่งพันเอ็ดบาทถ้วน"],
    ["100000", "หนึ่งแสนบาทถ้วน"],
    ["1000000", "หนึ่งล้านบาทถ้วน"],
    ["1000001", "หนึ่งล้านเอ็ดบาทถ้วน"],
    ["11000000", "สิบเอ็ดล้านบาทถ้วน"],
    ["121.50", "หนึ่งร้อยยี่สิบเอ็ดบาทห้าสิบสตางค์"],
    ["5.5", "ห้าบาทห้าสิบสตางค์"],
    ["5.05", "ห้าบาทห้าสตางค์"],
    ["5.01", "ห้าบาทหนึ่งสตางค์"],
    ["0.5", "ห้าสิบสตางค์"],
    ["0.01", "หนึ่งสตางค์"],
    ["1234567.89", "หนึ่งล้านสองแสนสามหมื่นสี่พันห้าร้อยหกสิบเจ็ดบาทแปดสิบเก้าสตางค์"],
    ["-5", "ลบห้าบาทถ้วน"],
    ["-0", "ศูนย์บาทถ้วน"],
    ["007", "เจ็ดบาทถ้วน"],
  ])("reads %s", (input, expected) => {
    expect(bahtText(input)).toBe(expected);
  });
  it("reads the largest supported amount", () => {
    expect(bahtText("999999999999.99")).toBe(
      "เก้าแสนเก้าหมื่นเก้าพันเก้าร้อยเก้าสิบเก้าล้านเก้าแสนเก้าหมื่นเก้าพันเก้าร้อยเก้าสิบเก้าบาทเก้าสิบเก้าสตางค์",
    );
  });
  it.each(["", " ", "abc", "1.234", "1.", "1e3", "1000000000000", "--1", "1,2,3x"])("rejects %j", (input) => {
    expect(() => bahtText(input)).toThrow("baht");
  });
});

describe("Buddhist year", () => {
  it("converts both ways", () => {
    expect(convertYear("2569", "be-to-ce")).toBe(2026);
    expect(convertYear("2026", "ce-to-be")).toBe(2569);
    expect(convertYear(" 544 ", "be-to-ce")).toBe(1);
  });
  it.each([
    ["", "ce-to-be"],
    ["0", "ce-to-be"],
    ["12.5", "ce-to-be"],
    ["abc", "be-to-ce"],
    ["543", "be-to-ce"],
    ["10000", "ce-to-be"],
    ["-5", "ce-to-be"],
  ] as const)("rejects %j as %s", (input, direction) => {
    expect(() => convertYear(input, direction)).toThrow("year");
  });
});

describe("Thai dates", () => {
  it("describes a date in both eras", () => {
    expect(describeDate("2026-10-31")).toEqual({
      thaiLong: "วันเสาร์ที่ 31 ตุลาคม พ.ศ. 2569",
      thaiShort: "31 ต.ค. 2569",
      thaiNumeric: "31/10/2569",
      gregorianLong: "Saturday, 31 October 2026",
      gregorianNumeric: "31/10/2026",
      buddhistYear: 2569,
    });
  });
  it("knows leap days and the weekday of 29 February 2000", () => {
    expect(describeDate("2000-02-29").thaiLong).toBe("วันอังคารที่ 29 กุมภาพันธ์ พ.ศ. 2543");
    expect(describeDate("2024-02-29").thaiShort).toBe("29 ก.พ. 2567");
  });
  it.each(["2025-02-29", "2026-13-01", "2026-04-31", "2026-1-1", "", "1940-12-31", "0001-01-01", "abcd-ef-gh"])("rejects %j", (input) => {
    expect(() => describeDate(input)).toThrow("date");
  });
  it("starts at 1 January 1941", () => {
    expect(describeDate("1941-01-01").buddhistYear).toBe(2484);
  });
});

describe("withholding tax", () => {
  const text = (result: ReturnType<typeof withholdingTax>) => Object.fromEntries(Object.entries(result).map(([key, value]) => [key, formatSatang(value)]));
  it("withholds from an amount with no VAT", () => {
    expect(text(withholdingTax("10000", "none", "3"))).toEqual({ base: "10,000.00", vat: "0.00", invoiceTotal: "10,000.00", withheld: "300.00", netPayment: "9,700.00" });
  });
  it("adds VAT on top and withholds from the amount before VAT", () => {
    expect(text(withholdingTax("10,000", "separate", "3"))).toEqual({ base: "10,000.00", vat: "700.00", invoiceTotal: "10,700.00", withheld: "300.00", netPayment: "10,400.00" });
  });
  it("takes VAT out of a VAT-inclusive amount", () => {
    expect(text(withholdingTax("10700", "included", "3"))).toEqual({ base: "10,000.00", vat: "700.00", invoiceTotal: "10,700.00", withheld: "300.00", netPayment: "10,400.00" });
  });
  it("rounds to the satang, half up", () => {
    expect(formatSatang(withholdingTax("0.50", "none", "5").withheld)).toBe("0.03");
    expect(formatSatang(withholdingTax("1000.10", "none", "3").withheld)).toBe("30.00");
    const included = withholdingTax("100", "included", "1");
    expect([included.base, included.vat, included.withheld]).toEqual([9346n, 654n, 93n]);
  });
  it("accepts a custom rate with two decimals", () => {
    expect(formatSatang(withholdingTax("1000", "none", "1.5").withheld)).toBe("15.00");
    expect(formatSatang(withholdingTax("1000", "none", "0").withheld)).toBe("0.00");
    expect(formatSatang(withholdingTax("1000", "none", "100").netPayment)).toBe("0.00");
  });
  it("stays exact for very large amounts", () => {
    expect(formatSatang(withholdingTax("9999999999.99", "none", "5").withheld)).toBe("500,000,000.00");
  });
  it.each([
    ["", "3"],
    ["0", "3"],
    ["-1", "3"],
    ["1.234", "3"],
    ["abc", "3"],
    ["10000000001", "3"],
    ["100", ""],
    ["100", "101"],
    ["100", "-1"],
    ["100", "3.123"],
    ["100", "abc"],
  ])("rejects amount %j with rate %j", (amount, rate) => {
    expect(() => withholdingTax(amount, "none", rate)).toThrow("tax");
  });
});

describe("VAT", () => {
  const text = (result: ReturnType<typeof vatBreakdown>) => Object.fromEntries(Object.entries(result).map(([key, value]) => [key, formatSatang(value)]));
  it("adds 7% to a price before VAT", () => {
    expect(text(vatBreakdown("1,000", "add"))).toEqual({ base: "1,000.00", vat: "70.00", total: "1,070.00" });
    expect(text(vatBreakdown("0.07", "add"))).toEqual({ base: "0.07", vat: "0.00", total: "0.07" });
    expect(text(vatBreakdown("0.08", "add"))).toEqual({ base: "0.08", vat: "0.01", total: "0.09" });
  });
  it("takes 7% out of a price that includes VAT", () => {
    expect(text(vatBreakdown("1070", "extract"))).toEqual({ base: "1,000.00", vat: "70.00", total: "1,070.00" });
    const odd = vatBreakdown("100", "extract");
    expect([odd.base, odd.vat]).toEqual([9346n, 654n]);
    expect(odd.base + odd.vat).toBe(10000n);
  });
  it.each(["", "0", "-5", "1.234", "abc", "10000000001"])("rejects %j", (input) => {
    expect(() => vatBreakdown(input, "add")).toThrow("vat");
  });
});

describe("Thai national ID", () => {
  it("accepts numbers with a correct check digit, in any spacing", () => {
    expect(checkThaiId("1101700230678")).toMatchObject({ valid: true, formatted: "1-1017-00230-67-8" });
    expect(checkThaiId("1-1017-00230-67-8").valid).toBe(true);
    expect(checkThaiId(" 1101700230678 ").valid).toBe(true);
  });
  it("reports a wrong check digit and the expected one", () => {
    expect(checkThaiId("1101700230673")).toMatchObject({ valid: false, expected: 8 });
  });
  it.each(["", "123", "11017002306781", "11017002306a3", "1.101700230673"])("rejects %j", (input) => {
    expect(() => checkThaiId(input)).toThrow("nationalid");
  });
});

describe("income tax", () => {
  it.each([
    ["100000", "0.00"],
    ["150000", "0.00"],
    ["150001", "0.05"],
    ["300000", "7,500.00"],
    ["500000", "27,500.00"],
    ["750000", "65,000.00"],
    ["1000000", "115,000.00"],
    ["2000000", "365,000.00"],
    ["5000000", "1,265,000.00"],
    ["6000000", "1,615,000.00"],
    ["600,000.50", "42,500.08"],
  ])("taxes %s net income at %s", (income, tax) => {
    expect(formatSatang(incomeTax(income).tax)).toBe(tax);
  });
  it("splits the income across the bands", () => {
    const result = incomeTax("620000");
    expect(result.rows.map((row) => formatSatang(row.taxable))).toEqual(["150,000.00", "150,000.00", "200,000.00", "120,000.00", "0.00", "0.00", "0.00", "0.00"]);
    expect(result.rows.map((row) => formatSatang(row.tax))).toEqual(["0.00", "7,500.00", "20,000.00", "18,000.00", "0.00", "0.00", "0.00", "0.00"]);
    expect(formatSatang(result.tax)).toBe("45,500.00");
  });
  it.each(["", "0", "-5", "1.234", "abc", "10000000001"])("rejects %j", (input) => {
    expect(() => incomeTax(input)).toThrow("income");
  });
});
