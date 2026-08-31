import { account } from "../server/account.js";
import { accessCookie, readPolicy } from "../server/mediaAccess.js";
import { json, mediaPath } from "../server/mediaPolicy.js";
export async function POST(request: Request) {
  const path = new URL(request.url).searchParams.get("id") ?? "";
  if (!mediaPath.test(path)) return json({ error: "Not found" }, 404);
  const owner = await account(request);
  if (!owner) return json({ error: "Sign in required" }, 401);
  try {
    const policy = await readPolicy(path);
    if (!policy || policy.expiresAt <= Date.now() || policy.owner !== owner) return json({ error: "Not found or access denied" }, 404);
    const response = json({ granted: true });
    response.headers.set("Set-Cookie", accessCookie(path, policy));
    return response;
  } catch { return json({ error: "Media unavailable" }, 503); }
}
