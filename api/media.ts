import { get } from "@vercel/blob";
import { json, mediaPath, mediaTypes } from "../server/mediaPolicy.js";
export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("id") ?? "";
  const match = mediaPath.exec(pathname);
  if (!match) return json({ error: "Not found" }, 404);
  const range = request.headers.get("range");
  if (range && !/^bytes=\d*-\d*$/.test(range)) return json({ error: "Invalid range" }, 416);
  try {
    const result = await get(pathname, { access: "private", useCache: false, headers: range ? { Range: range } : undefined });
    if (!result || result.statusCode !== 200) return json({ error: "Not found" }, 404);
    const headers = new Headers({ "Content-Type": mediaTypes[match[1]], "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Accept-Ranges": "bytes", "Content-Security-Policy": "default-src 'none'; sandbox" });
    for (const name of ["content-range", "content-length"]) { const value = result.headers.get(name); if (value) headers.set(name, value); }
    return new Response(result.stream, { status: headers.has("content-range") ? 206 : 200, headers });
  } catch { return json({ error: "Media unavailable" }, 503); }
}
