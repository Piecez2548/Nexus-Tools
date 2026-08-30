export const mediaTypes: Record<string, string> = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "video/mp4":"mp4", "video/webm":"webm" };
export const mediaIdPattern = /^media\/[a-f0-9]{64}\.(jpg|png|webp|mp4|webm)$/;
export function mediaLink(pathname: string) { const url = new URL(location.origin); url.searchParams.set("media", pathname); return url.href; }
export async function uploadMedia(file: File, key: string, progress: (value: number) => void) {
  const extension = mediaTypes[file.type];
  if (!extension || file.size === 0 || file.size > 50 * 1024 * 1024) throw new Error("file");
  const id = Array.from(crypto.getRandomValues(new Uint8Array(32)), v=>v.toString(16).padStart(2,"0")).join("");
  const { upload } = await import("@vercel/blob/client");
  const result = await upload(`media/${id}.${extension}`, file, { access:"private", handleUploadUrl:"/api/upload", headers:{Authorization:`Bearer ${key}`}, contentType:file.type, multipart:file.size > 4 * 1024 * 1024, onUploadProgress:e=>progress(Math.round(e.percentage)) });
  return result.pathname;
}
export interface MediaEntry { pathname:string; size:number; uploadedAt:string }
export async function listMedia(key: string, cursor?: string): Promise<{files:MediaEntry[];cursor:string|null}> {
  const response = await fetch(`/api/manage-media${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, {headers:{Authorization:`Bearer ${key}`},cache:"no-store"});
  if (!response.ok) throw new Error("storage");
  return response.json();
}
export async function deleteMedia(key:string, pathname:string) {
  const response = await fetch(`/api/manage-media?id=${encodeURIComponent(pathname)}`,{method:"DELETE",headers:{Authorization:`Bearer ${key}`}});
  if (!response.ok) throw new Error("delete");
}
