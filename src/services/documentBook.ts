import { validateInvoice, type Invoice } from "./invoice";
import { readLocal, saveLocal } from "./localData";
import { ToolError } from "./errors";
export type DocumentKind = "quotation" | "invoice" | "receipt";
export interface SavedDocument { id: string; savedAt: string; document: Invoice }
export interface Book { documents: SavedDocument[]; customers: string[]; products: Invoice["items"]; seller: string; counters: Record<string, number> }
const blank = (): Book => ({ documents: [], customers: [], products: [], seller: "", counters: {} });
export function readBook(): Book {
  const v = readLocal<Partial<Book>>("document-book", {});
  if (!v || !Array.isArray(v.documents) || !Array.isArray(v.customers) || !Array.isArray(v.products) || typeof v.seller !== "string" || !v.counters) return blank();
  const book = blank();
  book.seller = v.seller.slice(0,2000);
  book.customers = v.customers.filter(c=>typeof c === "string" && c.length <= 2000).slice(-100);
  book.products = v.products.filter(p=>p && typeof p.description === "string" && p.description.length<=2000 && typeof p.quantity === "string" && typeof p.price === "string" && Number.isFinite(Number(p.price)) && Number(p.price)>=0).slice(-200);
  book.documents = v.documents.filter(d=>{try {if(!d || typeof d.id!=="string" || typeof d.savedAt!=="string") return false; validateInvoice(d.document); return true;}catch{return false;}}).slice(0,100);
  book.counters = Object.fromEntries(Object.entries(v.counters).filter(([k,n])=>/^(QUO|INV|REC)-\d{4}$/.test(k) && Number.isSafeInteger(n) && n>=0 && n<1000000000));
  return book;
}
function writeBook(book: Book) { if (!saveLocal("document-book", book)) throw new ToolError("storage"); window.dispatchEvent(new Event("nexus-book-changed")); }
export function suggestNumber(kind: DocumentKind, date: string) {
  const year = /^\d{4}-/.test(date) ? date.slice(0,4) : String(new Date().getFullYear());
  const prefix = `${{quotation:"QUO",invoice:"INV",receipt:"REC"}[kind]}-${year}`;
  const book = readBook();
  let next = (book.counters[prefix] ?? 0) + 1;
  while (book.documents.some(d => d.document.number === `${prefix}-${String(next).padStart(4,"0")}`)) next++;
  return `${prefix}-${String(next).padStart(4,"0")}`;
}
export async function storeDocument(document: Invoice) {
  validateInvoice(document);
  const save = () => {
    const book = readBook();
    const existing = book.documents.find(d => d.document.number === document.number);
    if (existing) {
      if (JSON.stringify(existing.document) === JSON.stringify(document)) return;
      throw new ToolError("duplicate");
    }
    if (book.documents.length >= 100) throw new ToolError("storage");
    book.documents.unshift({ id: crypto.randomUUID(), savedAt: new Date().toISOString(), document: structuredClone(document) });
    const match = /^(QUO|INV|REC)-(\d{4})-(\d+)$/.exec(document.number);
    if (match) { const key = `${match[1]}-${match[2]}`; book.counters[key] = Math.max(book.counters[key] ?? 0, Number(match[3])); }
    writeBook(book);
  };
  if (navigator.locks) await navigator.locks.request("nexus-document-book", save); else save();
}
export function saveContacts(invoice: Invoice) {
  const b = readBook();
  b.seller = invoice.seller;
  if (invoice.customer.trim() && !b.customers.includes(invoice.customer)) b.customers.push(invoice.customer);
  for (const item of invoice.items) if (item.description.trim() && !b.products.some(p => p.description === item.description && p.price === item.price)) b.products.push({ ...item });
  b.customers = b.customers.slice(-100); b.products = b.products.slice(-200); writeBook(b);
}
export function deleteDocument(id: string) { const b = readBook(); b.documents = b.documents.filter(d => d.id !== id); writeBook(b); }
export function clearContacts() { const b = readBook(); b.customers = []; b.products = []; b.seller = ""; writeBook(b); }
