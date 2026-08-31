import { createHmac, timingSafeEqual } from "node:crypto";
import { get } from "@vercel/blob";
export interface MediaPolicy { access: "link" | "owner"; owner: string | null; expiresAt: number }
export const policyPath = (path: string) => `policies/${path.split("/").at(-1)}.json`;
export class MediaNotFound extends Error {}
export async function readPolicy(path: string): Promise<MediaPolicy | null> {
  if (!path.startsWith("media/v2/")) return null;
  const result = await get(policyPath(path), { access: "private", useCache: false });
  if (!result) throw new MediaNotFound("Media unavailable");
  if (result.statusCode !== 200) throw new Error("Policy unavailable");
  const policy = await new Response(result.stream).json() as MediaPolicy;
  if (!["link", "owner"].includes(policy.access) || !Number.isFinite(policy.expiresAt) || (policy.access === "owner" && !policy.owner)) throw new Error("Invalid policy");
  return policy;
}
export const cookieName = (path: string) => `nexus-media-${path.split("/").at(-1)!.slice(0, 24)}`;
function signature(path: string, expires: number, owner: string) {
  const secret = process.env.MEDIA_ADMIN_KEY;
  if (!secret || secret.length < 32) throw new Error("Cookie signing unavailable");
  return createHmac("sha256", secret).update(`${path}:${expires}:${owner}`).digest("hex");
}
export function accessCookie(path: string, policy: MediaPolicy) {
  const expires = Math.min(policy.expiresAt, Date.now() + 15 * 60_000);
  return `${cookieName(path)}=${expires}.${signature(path, expires, policy.owner!)}; Path=/api/media; Max-Age=${Math.max(0, Math.floor((expires - Date.now()) / 1000))}; Secure; HttpOnly; SameSite=Strict`;
}
export function hasAccessCookie(request: Request, path: string, policy: MediaPolicy) {
  const raw = request.headers.get("cookie")?.split("; ").find(v => v.startsWith(`${cookieName(path)}=`))?.split("=")[1];
  const match = raw?.match(/^(\d{13})\.([a-f0-9]{64})$/);
  if (!match || Number(match[1]) <= Date.now() || Number(match[1]) > policy.expiresAt) return false;
  return timingSafeEqual(Buffer.from(match[2]), Buffer.from(signature(path, Number(match[1]), policy.owner!)));
}
