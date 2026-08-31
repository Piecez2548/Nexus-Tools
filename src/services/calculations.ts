import { ToolError } from "./errors.js";
export const unitGroups = {
  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
  },
  weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125 },
  temperature: { C: 1, F: 1, K: 1 },
} as const;
export type UnitGroup = keyof typeof unitGroups;
export function convertUnit(
  raw: string,
  group: UnitGroup,
  from: string,
  to: string,
) {
  if (!raw.trim()) throw new ToolError("number");
  const value = Number(raw),
    factors: Record<string, number> = unitGroups[group];
  if (
    !Number.isFinite(value) ||
    !Object.hasOwn(factors, from) ||
    !Object.hasOwn(factors, to)
  )
    throw new ToolError("number");
  let result: number;
  if (group === "temperature") {
    const kelvin =
      from === "K"
        ? value
        : from === "C"
          ? value + 273.15
          : ((value - 32) * 5) / 9 + 273.15;
    if (kelvin < -1e-10) throw new ToolError("temperature");
    result =
      to === "K"
        ? kelvin
        : to === "C"
          ? kelvin - 273.15
          : ((kelvin - 273.15) * 9) / 5 + 32;
  } else result = (value * factors[from]) / factors[to];
  if (!Number.isFinite(result)) throw new ToolError("number");
  return Number(result.toPrecision(12));
}
export function countText(text: string, locale: string) {
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  const graphemes = new Intl.Segmenter(locale, { granularity: "grapheme" });
  return {
    words: [...segmenter.segment(text)].filter((item) => item.isWordLike)
      .length,
    characters: text.length,
    graphemes: [...graphemes.segment(text)].length,
    paragraphs: text.trim() ? text.trim().split(/\n\s*\n/).length : 0,
    bytes: new TextEncoder().encode(text).length,
  };
}
export interface InvoiceItem {
  description: string;
  quantity: string;
  price: string;
}
export function invoiceTotals(items: InvoiceItem[], rawTax: string) {
  const tax = Number(rawTax);
  if (
    !rawTax.trim() ||
    !Number.isFinite(tax) ||
    tax < 0 ||
    tax > 100 ||
    items.length < 1 ||
    items.length > 30
  )
    throw new ToolError("invoice");
  const lines = items.map((item) => {
    const quantity = Number(item.quantity),
      price = Number(item.price);
    if (
      !item.description.trim() ||
      !/^\d+$/.test(item.quantity) ||
      quantity < 1 ||
      quantity > 100000 ||
      !/^\d+(?:\.\d{1,2})?$/.test(item.price) ||
      price > 10000000
    )
      throw new ToolError("invoice");
    return Math.round(price * 100) * quantity;
  });
  const subtotal = lines.reduce((sum, line) => sum + line, 0),
    taxAmount = Math.round((subtotal * tax) / 100);
  if (!Number.isSafeInteger(subtotal + taxAmount))
    throw new ToolError("invoice");
  return { lines, subtotal, tax: taxAmount, total: subtotal + taxAmount };
}

