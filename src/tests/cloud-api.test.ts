// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
vi.mock("../../server/account",()=>({account:vi.fn()}));
vi.mock("@vercel/blob",()=>({ get:vi.fn(),put:vi.fn(),BlobPreconditionFailedError:class extends Error{} }));
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { account } from "../../server/account";
import { GET, PUT, POST } from "../../api/cloud-book";
const empty={documents:[],customers:[],products:[],seller:"",counters:{}};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(account).mockResolvedValue("user-a");});
test("cloud endpoints require verified identity",async()=>{
  vi.mocked(account).mockResolvedValue(null);
  for(const handler of [GET,PUT,POST]) expect((await handler(new Request("https://example.com/api/cloud-book"))).status).toBe(401);
  expect(get).not.toHaveBeenCalled();expect(put).not.toHaveBeenCalled();
});
test("cloud writes use verified owner and conditional revision",async()=>{
  vi.mocked(put).mockResolvedValue({etag:"new"} as Awaited<ReturnType<typeof put>>);
  const result=await PUT(new Request("https://example.com/api/cloud-book?owner=other",{method:"PUT",headers:{"If-Match":"original"},body:JSON.stringify(empty)}));
  expect(result.status).toBe(200);expect(put).toHaveBeenCalledWith("books/user-a.json",expect.any(String),expect.objectContaining({ifMatch:"original",access:"private"}));
});
test("a stale revision reports conflict without blind overwrite",async()=>{
  vi.mocked(put).mockRejectedValue(new BlobPreconditionFailedError());
  expect((await PUT(new Request("https://example.com/api/cloud-book",{method:"PUT",headers:{"If-Match":"old"},body:JSON.stringify(empty)}))).status).toBe(409);
  expect(put).toHaveBeenCalledTimes(1);
});
test("concurrent document reservation retries and reserves the next number",async()=>{
  const remote=(n:number)=>({statusCode:200,blob:{etag:`rev${n}`},stream:new Response(JSON.stringify({...empty,counters:{"INV-2026":n}})).body}) as Awaited<ReturnType<typeof get>>;
  vi.mocked(get).mockResolvedValueOnce(remote(1)).mockResolvedValueOnce(remote(2));
  vi.mocked(put).mockRejectedValueOnce(new BlobPreconditionFailedError()).mockResolvedValueOnce({etag:"new"} as Awaited<ReturnType<typeof put>>);
  const response=await POST(new Request("https://example.com/api/cloud-book",{method:"POST",body:JSON.stringify({kind:"invoice",date:"2026-08-31",book:empty})}));
  expect(response.status).toBe(200);expect((await response.json()).number).toBe("INV-2026-0003");
  expect(put).toHaveBeenLastCalledWith("books/user-a.json",expect.any(String),expect.objectContaining({ifMatch:"rev2"}));
});
