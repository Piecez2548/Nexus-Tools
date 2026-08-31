import { beforeEach, expect, test } from "vitest";
import { exportBackup, mergeBooks, parseBackup, validateBook } from "../services/bookBackup";
import { readBook, storeDocument, writeBook } from "../services/documentBook";
import type { Invoice } from "../services/invoice";
const invoice: Invoice = { seller:"Nexus", customer:"Customer", number:"INV-2026-0001", date:"2026-08-31",currency:"THB",tax:"0",items:[{description:"Service",quantity:"1",price:"100"}],language:"en" };
beforeEach(() => localStorage.clear());
test("versioned and legacy backups round trip with counters and contacts", async () => {
  await storeDocument(invoice);
  const book = readBook(); book.counters["INV-2026"] = 10;
  expect(parseBackup(exportBackup(book))).toEqual(book);
  expect(parseBackup(JSON.stringify(book))).toEqual(book);
  expect(mergeBooks(book, book).documents).toHaveLength(1);
});
test("invalid backup, unsupported version and duplicate records are rejected atomically", async () => {
  await storeDocument(invoice); const original = readBook();
  for (const value of [{...original, documents:[...original.documents,...original.documents]}, {...original, counters:JSON.parse('{"__proto__":2}')}, {...original, products:[{description:"X",quantity:"NaN",price:"0"}]}]) expect(() => writeBook(mergeBooks(readBook(), validateBook(value)))).toThrow();
  expect(() => parseBackup('{"version":2,"app":"nexus-tools"}')).toThrow();
  expect(readBook()).toEqual(original);
});
test("conflicting document numbers do not overwrite local documents", async () => {
  await storeDocument(invoice); const original=readBook(), other=structuredClone(original);
  other.documents[0].document.customer="Different customer";
  expect(() => mergeBooks(original,other)).toThrow(/Conflicting/);
  expect(readBook()).toEqual(original);
});
test("merge never truncates history and preserves highest reserved number",async()=>{
  await storeDocument(invoice);const original=readBook(), other=structuredClone(original);
  other.documents=[];other.counters["INV-2026"]=20;
  expect(mergeBooks(original,other).counters["INV-2026"]).toBe(20);
  other.customers=Array.from({length:100},(_,i)=>`Customer ${i}`);original.customers=["Different"];
  expect(()=>mergeBooks(original,other)).toThrow();
});
