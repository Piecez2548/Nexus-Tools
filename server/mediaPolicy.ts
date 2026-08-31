import { timingSafeEqual } from "node:crypto";
export const mediaTypes: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4", webm: "video/webm" };
export const mediaPath = /^media\/(?:v2\/)?[a-f0-9]{64}\.(jpg|png|webp|mp4|webm)$/;
export const maxMediaSize = 50 * 1024 * 1024;
export function authorized(request: Request) {
  const expected = process.env.MEDIA_ADMIN_KEY;
  const value = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return !!expected && expected.length >= 32 && Buffer.byteLength(value) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" } });
}
