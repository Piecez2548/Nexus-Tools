import { ToolError } from "./errors.js";

const digitWords = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const placeWords = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];
const maxBahtDigits = 12;

// Reads 1..999,999. `hasHigher` marks a lower group that follows a million group.
function readGroup(value: number, hasHigher: boolean) {
  const digits = String(value);
  let words = "";
  for (let index = 0; index < digits.length; index++) {
    const digit = Number(digits[index]);
    const place = digits.length - 1 - index;
    if (digit === 0) continue;
    if (place === 0) words += digit === 1 && (digits.length > 1 || hasHigher) ? "เอ็ด" : digitWords[digit];
    else if (place === 1) words += digit === 1 ? "สิบ" : digit === 2 ? "ยี่สิบ" : digitWords[digit] + "สิบ";
    else words += digitWords[digit] + placeWords[place];
  }
  return words;
}

function readInteger(value: number) {
  if (value === 0) return digitWords[0];
  const high = Math.floor(value / 1_000_000);
  const low = value % 1_000_000;
  return (high ? readGroup(high, false) + "ล้าน" : "") + (low ? readGroup(low, high > 0) : "");
}

/** Reads an amount of money aloud in Thai, as written on cheques and invoices. */
export function bahtText(raw: string) {
  const match = /^(-)?(\d*)(?:\.(\d{1,2}))?$/.exec(raw.trim().replace(/,/g, ""));
  if (!match || (!match[2] && !match[3])) throw new ToolError("baht");
  const whole = match[2].replace(/^0+(?=\d)/, "") || "0";
  if (whole.length > maxBahtDigits) throw new ToolError("baht");
  const baht = Number(whole);
  const satang = Number((match[3] ?? "").padEnd(2, "0") || "0");
  const negative = match[1] === "-" && (baht > 0 || satang > 0);
  let text: string;
  if (baht === 0 && satang === 0) text = digitWords[0] + "บาทถ้วน";
  else {
    text = baht > 0 ? readInteger(baht) + "บาท" : "";
    text += satang > 0 ? readGroup(satang, false) + "สตางค์" : "ถ้วน";
  }
  return (negative ? "ลบ" : "") + text;
}

const buddhistOffset = 543;
export type YearDirection = "be-to-ce" | "ce-to-be";
const yearLimits = { "be-to-ce": [buddhistOffset + 1, 9999 + buddhistOffset], "ce-to-be": [1, 9999] } as const;

export function convertYear(raw: string, direction: YearDirection) {
  const text = raw.trim();
  const year = Number(text);
  const [min, max] = yearLimits[direction];
  if (!/^\d{1,5}$/.test(text) || year < min || year > max) throw new ToolError("year");
  return direction === "be-to-ce" ? year - buddhistOffset : year + buddhistOffset;
}

const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const thaiWeekdays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const englishWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Thailand moved the new year from 1 April to 1 January in 1941 (B.E. 2484).
const firstSupportedYear = 1941;

/** Formats a calendar date in both eras. `iso` is a YYYY-MM-DD date in the Gregorian calendar. */
export function describeDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new ToolError("date");
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!valid || year < firstSupportedYear || year > 9999) throw new ToolError("date");
  const weekday = date.getUTCDay();
  const buddhistYear = year + buddhistOffset;
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    thaiLong: `วัน${thaiWeekdays[weekday]}ที่ ${day} ${thaiMonths[month - 1]} พ.ศ. ${buddhistYear}`,
    thaiShort: `${day} ${thaiMonthsShort[month - 1]} ${buddhistYear}`,
    thaiNumeric: `${pad(day)}/${pad(month)}/${buddhistYear}`,
    gregorianLong: `${englishWeekdays[weekday]}, ${day} ${englishMonths[month - 1]} ${year}`,
    gregorianNumeric: `${pad(day)}/${pad(month)}/${year}`,
    buddhistYear,
  };
}

// Rates from the Revenue Department notice on section 3 tredecim of the Revenue Code
// (rd.go.th/3535.html). The kind of income and of recipient decides the real rate.
export const withholdingRates = [
  { id: "contract", percent: "3", en: "Contract work and independent professions", th: "ค่าจ้างทำของ / วิชาชีพอิสระ" },
  { id: "advertising", percent: "2", en: "Advertising", th: "ค่าโฆษณา" },
  { id: "rent", percent: "5", en: "Rent paid to a Thai company or partnership", th: "ค่าเช่า (ผู้รับเป็นบริษัท/ห้างหุ้นส่วนนิติบุคคลไทย)" },
  { id: "prize", percent: "5", en: "Prizes and public performers", th: "รางวัล / นักแสดงสาธารณะ" },
] as const;
export type VatMode = "none" | "separate" | "included";
const vatPercent = 7n;
const maxSatang = 10_000_000_000_00n;

/** Reads an amount above zero with at most two decimals, in satang. */
export function parseMoney(raw: string, code = "tax") {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(raw.trim().replace(/,/g, ""));
  if (!match) throw new ToolError(code);
  const satang = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  if (satang <= 0n || satang > maxSatang) throw new ToolError(code);
  return satang;
}
// Rounds half up for non-negative values.
export const roundedDivide = (numerator: bigint, denominator: bigint) => (numerator * 2n + denominator) / (2n * denominator);

/** All amounts are in satang so that no floating point rounding is involved. */
export function withholdingTax(rawAmount: string, vat: VatMode, rawRate: string) {
  const rate = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(rawRate.trim());
  if (!rate) throw new ToolError("tax");
  const rateBasisPoints = BigInt(rate[1]) * 100n + BigInt((rate[2] ?? "").padEnd(2, "0") || "0");
  if (rateBasisPoints > 10_000n) throw new ToolError("tax");
  const entered = parseMoney(rawAmount);
  let base = entered;
  let vatAmount = 0n;
  if (vat === "separate") vatAmount = roundedDivide(base * vatPercent, 100n);
  if (vat === "included") {
    base = roundedDivide(entered * 100n, 100n + vatPercent);
    vatAmount = entered - base;
  }
  const withheld = roundedDivide(base * rateBasisPoints, 10_000n);
  const invoiceTotal = base + vatAmount;
  return { base, vat: vatAmount, invoiceTotal, withheld, netPayment: invoiceTotal - withheld };
}

export function formatSatang(satang: bigint) {
  return `${(satang / 100n).toLocaleString("en-US")}.${String(satang % 100n).padStart(2, "0")}`;
}

export type VatDirection = "add" | "extract";

/** VAT at 7%: `add` treats the amount as the price before VAT, `extract` as the price including it. */
export function vatBreakdown(rawAmount: string, direction: VatDirection) {
  const entered = parseMoney(rawAmount, "vat");
  const base = direction === "add" ? entered : roundedDivide(entered * 100n, 100n + vatPercent);
  const vat = direction === "add" ? roundedDivide(entered * vatPercent, 100n) : entered - base;
  return { base, vat, total: base + vat };
}

/** Checks the format and check digit of a Thai national ID number. It cannot tell whether the number is issued. */
export function checkThaiId(raw: string) {
  const digits = raw.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(digits)) throw new ToolError("nationalid");
  let sum = 0;
  for (let index = 0; index < 12; index++) sum += Number(digits[index]) * (13 - index);
  const expected = (11 - (sum % 11)) % 10;
  return {
    valid: expected === Number(digits[12]),
    expected,
    formatted: `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`,
  };
}

// Progressive rates for personal income tax on net income (after expenses and allowances),
// in force since tax year 2017. Upper limits are in baht; the last band has none.
const incomeTaxBands = [
  { from: 0n, to: 150_000n, percent: 0n },
  { from: 150_000n, to: 300_000n, percent: 5n },
  { from: 300_000n, to: 500_000n, percent: 10n },
  { from: 500_000n, to: 750_000n, percent: 15n },
  { from: 750_000n, to: 1_000_000n, percent: 20n },
  { from: 1_000_000n, to: 2_000_000n, percent: 25n },
  { from: 2_000_000n, to: 5_000_000n, percent: 30n },
  { from: 5_000_000n, to: null, percent: 35n },
] as const;

/** Tax on net income, band by band. Amounts are in satang; the total is rounded half up. */
export function incomeTax(rawNetIncome: string) {
  const income = parseMoney(rawNetIncome, "income");
  const rows = incomeTaxBands.map((band) => {
    const lower = band.from * 100n;
    const upper = band.to === null ? income : band.to * 100n;
    const taxable = income > lower ? (income < upper ? income : upper) - lower : 0n;
    return { from: band.from, to: band.to, percent: band.percent, taxable, exact: taxable * band.percent };
  });
  const tax = roundedDivide(rows.reduce((sum, row) => sum + row.exact, 0n), 100n);
  return {
    income,
    tax,
    rows: rows.map((row) => ({ from: row.from, to: row.to, percent: row.percent, taxable: row.taxable, tax: roundedDivide(row.exact, 100n) })),
  };
}
