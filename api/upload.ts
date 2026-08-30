import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authorized, json, maxMediaSize, mediaPath, mediaTypes } from "../server/mediaPolicy.js";
export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 8192) return json({ error: "Invalid request" }, 400);
    const body = JSON.parse(raw) as HandleUploadBody;
    if (body.type !== "blob.generate-client-token") return json({ error: "Invalid request" }, 400);
    return json(await handleUpload({ request, body, onBeforeGenerateToken: async pathname => {
      const match = mediaPath.exec(pathname);
      if (!match) throw new Error("Invalid path");
      return { allowedContentTypes: [mediaTypes[match[1]]], maximumSizeInBytes: maxMediaSize, addRandomSuffix: false, allowOverwrite: false, validUntil: Date.now() + 5 * 60_000 };
    } }));
  } catch { return json({ error: "Upload unavailable or invalid file" }, 400); }
}
