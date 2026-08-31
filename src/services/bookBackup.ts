import { validateInvoice, type Invoice } from "./invoice.js";
import type { Book } from "./documentBook.js";

export const backupLimit = 10 * 1024 * 1024;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.length <= 2000;
export function validateBook(value: unknown): Book {
  if (!object(value) || !text(value.seller) || !Array.isArray(value.documents) || value.documents.length > 100 || !Array.isArray(value.customers) || value.customers.length > 100 || !value.customers.every(text) || !Array.isArray(value.products) || value.products.length > 200 || !object(value.counters)) throw new Error("Invalid backup");
  for (const p of value.products) {
    if (!object(p) || !text(p.description) || !text(p.quantity) || !text(p.price) || !p.quantity.trim() || !p.price.trim() || !Number.isFinite(Number(p.quantity)) || Number(p.quantity) <= 0 || !Number.isFinite(Number(p.price)) || Number(p.price) < 0) throw new Error("Invalid product");
  }
  const ids = new Set<string>(), numbers = new Set<string>();
  for (const d of value.documents) {
    if (!object(d) || typeof d.id !== "string" || !/^[a-f0-9-]{36}$/i.test(d.id) || typeof d.savedAt !== "string" || !Number.isFinite(Date.parse(d.savedAt))) throw new Error("Invalid document");
    validateInvoice(d.document as Invoice);
    const number = (d.document as Invoice).number;
    if (ids.has(d.id) || numbers.has(number)) throw new Error("Duplicate document");
    ids.add(d.id); numbers.add(number);
  }
  for (const [key, n] of Object.entries(value.counters)) if (!/^(QUO|INV|REC)-\d{4}$/.test(key) || !Number.isSafeInteger(n) || Number(n) < 0 || Number(n) >= 1e9) throw new Error("Invalid counter");
  const book = structuredClone(value) as unknown as Book;
  // Deleted document numbers remain reserved; imported history may increase counters.
  for (const d of book.documents) {
    const m = /^(QUO|INV|REC)-(\d{4})-(\d{1,9})$/.exec(d.document.number);
    if (m) book.counters[`${m[1]}-${m[2]}`] = Math.max(book.counters[`${m[1]}-${m[2]}`] ?? 0, Number(m[3]));
  }
  return book;
}
export function parseBackup(raw: string): Book {
  if (new TextEncoder().encode(raw).length > backupLimit) throw new Error("Backup exceeds 10 MB");
  const value: unknown = JSON.parse(raw);
  if (object(value) && "version" in value) {
    if (value.version !== 1 || value.app !== "nexus-tools") throw new Error("Unsupported backup version");
    return validateBook(value.book);
  }
  return validateBook(value); // Original exports did not contain a version wrapper.
}
export function exportBackup(book: Book) {
  return JSON.stringify({ app: "nexus-tools", version: 1, exportedAt: new Date().toISOString(), book: validateBook(book) }, null, 2);
}
export function mergeBooks(current: Book, incoming: Book): Book {
  const result = validateBook(current), other = validateBook(incoming);
  for (const d of other.documents) {
    const existing = result.documents.find(v => v.id === d.id || v.document.number === d.document.number);
    if (existing) {
      if (JSON.stringify(existing.document) !== JSON.stringify(d.document)) throw new Error(`Conflicting document: ${d.document.number}`);
    } else result.documents.push(d);
  }
  result.customers = [...new Set([...result.customers, ...other.customers])];
  for (const p of other.products) if (!result.products.some(v => v.description === p.description && v.price === p.price)) result.products.push(p);
  result.seller ||= other.seller;
  for (const [k, n] of Object.entries(other.counters)) result.counters[k] = Math.max(result.counters[k] ?? 0, n);
  result.documents.sort((a,b) => b.savedAt.localeCompare(a.savedAt));
  return validateBook(result); // Never truncate a backup to fit capacity.
}
