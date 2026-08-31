import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { account } from "../server/account.js";
import { json } from "../server/mediaPolicy.js";
import { parseBackup, mergeBooks, validateBook } from "../src/services/bookBackup.js";

const backupLimit = 3 * 1024 * 1024;
export async function GET(request: Request) {
  const owner = await account(request);
  if (!owner) return json({ error: "Sign in required" }, 401);
  try {
    const result = await get(`books/${owner}.json`, { access: "private", useCache: false });
    if (!result) return json({ book: null, revision: null });
    if (result.statusCode !== 200) return json({ error: "Storage unavailable" }, 503);
    return json({ book: parseBackup(await new Response(result.stream).text()), revision: result.blob.etag });
  } catch { return json({ error: "Storage unavailable" }, 503); }
}
export async function PUT(request: Request) {
  const owner = await account(request);
  if (!owner) return json({ error: "Sign in required" }, 401);
  try {
    if (Number(request.headers.get("content-length")) > backupLimit) return json({ error: "Backup too large" }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > backupLimit) return json({ error: "Backup too large" }, 413);
    const book = parseBackup(raw);
    const revision = request.headers.get("if-match");
    if (revision && revision.length > 200) return json({ error: "Invalid revision" }, 400);
    const result = await put(`books/${owner}.json`, JSON.stringify(book), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: !!revision, ...(revision ? { ifMatch: revision } : {}) });
    return json({ revision: result.etag });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || (error instanceof Error && /already exists/i.test(error.message))) return json({ error: "Another device changed this book. Sync again." }, 409);
    return json({ error: "Invalid backup or storage unavailable" }, 400);
  }
}

// Atomic compare-and-swap reservation. A collision retries against the latest book.
export async function POST(request: Request) {
  const owner = await account(request);
  if (!owner) return json({ error: "Sign in required" }, 401);
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > backupLimit) return json({ error: "Backup too large" }, 413);
    const input = JSON.parse(raw);
    if (!["invoice", "quotation", "receipt"].includes(input.kind) || typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return json({ error: "Invalid number request" }, 400);
    const local = validateBook(input.book);
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = await get(`books/${owner}.json`, { access: "private", useCache: false });
      if (current && current.statusCode !== 200) throw new Error("Storage unavailable");
      const merged = current ? mergeBooks(local, parseBackup(await new Response(current.stream).text())) : structuredClone(local);
      const prefix = `${input.kind === "invoice" ? "INV" : input.kind === "quotation" ? "QUO" : "REC"}-${input.date.slice(0,4)}`;
      const next = (merged.counters[prefix] ?? 0) + 1;
      if (next >= 1e9) throw new Error("Number range exceeded");
      merged.counters[prefix] = next;
      try {
        await put(`books/${owner}.json`, JSON.stringify(merged), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: !!current, ...(current ? { ifMatch: current.blob.etag } : {}) });
        return json({ book: merged, number: `${prefix}-${String(next).padStart(4,"0")}` });
      } catch (error) {
        if (!(error instanceof BlobPreconditionFailedError) && !(error instanceof Error && /already exists/i.test(error.message))) throw error;
      }
    }
    return json({ error: "Concurrent reservation. Try again." }, 409);
  } catch { return json({ error: "Invalid book, document conflict or storage unavailable" }, 400); }
}
