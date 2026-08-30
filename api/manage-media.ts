import { list, del } from "@vercel/blob";
import { authorized, json, mediaPath } from "../server/mediaPolicy.js";
export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
    if (cursor && cursor.length > 1000) return json({ error: "Invalid cursor" }, 400);
    const result = await list({ prefix: "media/", limit: 100, cursor });
    return json({ files: result.blobs.filter(b => mediaPath.test(b.pathname)).map(b => ({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt })), cursor: result.hasMore ? result.cursor : null });
  } catch { return json({ error: "Storage unavailable" }, 503); }
}
export async function DELETE(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const pathname = new URL(request.url).searchParams.get("id") ?? "";
  if (!mediaPath.test(pathname)) return json({ error: "Invalid file" }, 400);
  try { await del(pathname); return json({ deleted: true }); }
  catch { return json({ error: "Deletion failed" }, 503); }
}
