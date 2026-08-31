import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { put } from "@vercel/blob";
import { account } from "../server/account.js";
import { policyPath } from "../server/mediaAccess.js";
import { authorized, json, maxMediaSize, mediaPath, mediaTypes } from "../server/mediaPolicy.js";
export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 8192) return json({ error: "Invalid request" }, 400);
    const body = JSON.parse(raw) as HandleUploadBody;
    if (body.type !== "blob.generate-client-token") return json({ error: "Invalid request" }, 400);
    return json(await handleUpload({ request, body, onBeforeGenerateToken: async (pathname, clientPayload) => {
      const match = mediaPath.exec(pathname);
      if (!match) throw new Error("Invalid path");
      if (pathname.startsWith("media/v2/")) {
        const settings = JSON.parse(clientPayload ?? "{}");
        if (!["link", "owner"].includes(settings.access) || !Number.isInteger(settings.days) || settings.days < 1 || settings.days > 365) throw new Error("Invalid policy");
        const owner = settings.access === "owner" ? await account(request, "x-nexus-authorization") : null;
        if (settings.access === "owner" && !owner) throw new Error("Sign in required");
        await put(policyPath(pathname), JSON.stringify({ access: settings.access, owner, expiresAt: Date.now() + settings.days * 86_400_000 }), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json" });
      }
      return { allowedContentTypes: [mediaTypes[match[1]]], maximumSizeInBytes: maxMediaSize, addRandomSuffix: false, allowOverwrite: false, validUntil: Date.now() + 5 * 60_000 };
    } }));
  } catch { return json({ error: "Upload unavailable or invalid file" }, 400); }
}
