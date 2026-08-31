import { accessToken } from "./account";
import { mergeBooks, validateBook } from "./bookBackup";
import { readBook, writeBook, type DocumentKind } from "./documentBook";

// Explicit sync only. Existing local records are never uploaded by signing in.
export async function syncBook() {
  const token = await accessToken();
  const initial = readBook(), initialJSON = JSON.stringify(initial);
  const headers = { Authorization: `Bearer ${token}` };
  const remote = await fetch("/api/cloud-book", { headers, cache: "no-store" });
  if (!remote.ok) throw new Error("Cloud unavailable");
  const { book, revision } = await remote.json();
  const merged = book === null ? initial : mergeBooks(initial, validateBook(book));
  const response = await fetch("/api/cloud-book", { method: "PUT", headers: { ...headers, "Content-Type": "application/json", ...(revision ? { "If-Match": revision } : {}) }, body: JSON.stringify(merged) });
  if (!response.ok) throw new Error(response.status === 409 ? "Concurrent change. Sync again." : "Cloud save failed");
  // Do not overwrite local changes made while the network request was running.
  const apply = () => writeBook(JSON.stringify(readBook()) === initialJSON ? merged : mergeBooks(readBook(), merged));
  if (navigator.locks) await navigator.locks.request("nexus-document-book", apply); else apply();
}
export async function reserveCloudNumber(kind: DocumentKind, date: string) {
  const token = await accessToken();
  const response = await fetch("/api/cloud-book", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ kind, date, book: readBook() }) });
  if (!response.ok) throw new Error("Number reservation failed");
  const result = await response.json();
  const apply = () => writeBook(mergeBooks(readBook(), validateBook(result.book)));
  if (navigator.locks) await navigator.locks.request("nexus-document-book", apply); else apply();
  return result.number as string;
}
