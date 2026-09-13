// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
vi.mock("@vercel/blob",()=>({get:vi.fn(),list:vi.fn(),del:vi.fn()}));
import { get, list, del } from "@vercel/blob";
import { GET as view } from "../../api/media";
import { GET as manage, DELETE as remove } from "../../api/manage-media";
import { POST as upload } from "../../api/upload";
import { accessCookie, hasAccessCookie } from "../../server/mediaAccess";
const id=`media/${"a".repeat(64)}.png`;
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
test("management and upload fail closed without administrator credentials",async()=>{
  vi.stubEnv("MEDIA_ADMIN_KEY","b".repeat(64));
  for(const handler of [manage,remove,upload]) expect((await handler(new Request("https://example.com/api/test"))).status).toBe(401);
  expect(list).not.toHaveBeenCalled();expect(del).not.toHaveBeenCalled();
});
test("invalid paths cannot retrieve or delete other store objects",async()=>{
  vi.stubEnv("MEDIA_ADMIN_KEY","b".repeat(64));
  expect((await view(new Request("https://example.com/api/media?id=https://evil.test/secret"))).status).toBe(404);
  expect((await remove(new Request("https://example.com/api/manage-media?id=../secret",{headers:{Authorization:`Bearer ${"b".repeat(64)}`}}))).status).toBe(400);
  expect(get).not.toHaveBeenCalled();expect(del).not.toHaveBeenCalled();
});
test("private media streams have no cache and preserve video ranges",async()=>{
  vi.mocked(get).mockResolvedValue({statusCode:200,stream:new ReadableStream({start(c){c.close();}}),headers:new Headers({"content-range":"bytes 0-9/100","content-length":"10"}),blob:{contentType:"image/png",size:10}} as unknown as Awaited<ReturnType<typeof get>>);
  const response=await view(new Request(`https://example.com/api/media?id=${id}`,{headers:{Range:"bytes=0-9"}}));
  expect(response.status).toBe(206);expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(get).toHaveBeenCalledWith(id,expect.objectContaining({useCache:false,access:"private"}));
});
test("expired and owner-only media never stream content without authorization",async()=>{
  const path=`media/v2/${"a".repeat(64)}.png`;
  for(const [policy,status] of [[{access:"link",owner:null,expiresAt:Date.now()-1000},410],[{access:"owner",owner:"user-a",expiresAt:Date.now()+60000},403]] as const){
    vi.mocked(get).mockResolvedValueOnce({statusCode:200,stream:new Response(JSON.stringify(policy)).body} as Awaited<ReturnType<typeof get>>);
    expect((await view(new Request(`https://example.com/api/media?id=${path}`))).status).toBe(status);
  }
  expect(get).toHaveBeenCalledTimes(2);
  expect(get).not.toHaveBeenCalledWith(path,expect.anything());
});
test("missing policies fail closed rather than exposing a private upload",async()=>{
  vi.mocked(get).mockResolvedValueOnce(null);
  expect((await view(new Request(`https://example.com/api/media?id=media/v2/${"a".repeat(64)}.png`))).status).toBe(404);
  expect(get).toHaveBeenCalledTimes(1);
});
test("media access cookies are signed, owner-bound, path-bound and expiring",()=>{
  vi.stubEnv("MEDIA_ADMIN_KEY","b".repeat(64));
  vi.stubEnv("MEDIA_COOKIE_SIGNING_KEY","c".repeat(64));
  const path=`media/v2/${"a".repeat(64)}.png`,policy={access:"owner" as const,owner:"user-a",expiresAt:Date.now()+60000};
  const cookie=accessCookie(path,policy);
  const request=new Request("https://example.com/api/media",{headers:{cookie:cookie.split(";")[0]}});
  expect(cookie).toContain("HttpOnly; SameSite=Strict");
  expect(hasAccessCookie(request,path,policy)).toBe(true);
  expect(hasAccessCookie(request,path,{...policy,owner:"user-b"})).toBe(false);
  expect(hasAccessCookie(request,path.replace(".png",".jpg"),policy)).toBe(false);
  expect(hasAccessCookie(request,path,{...policy,expiresAt:Date.now()-1})).toBe(false);
});
test("administrator credentials cannot be reused to forge media access cookies",()=>{
  vi.stubEnv("MEDIA_ADMIN_KEY","b".repeat(64));
  const path=`media/v2/${"a".repeat(64)}.png`,policy={access:"owner" as const,owner:"user-a",expiresAt:Date.now()+60000};
  expect(()=>accessCookie(path,policy)).toThrow("Cookie signing unavailable");
});
