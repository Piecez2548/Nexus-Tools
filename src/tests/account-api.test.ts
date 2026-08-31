// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
const { getUser } = vi.hoisted(()=>({getUser:vi.fn()}));
vi.mock("@supabase/supabase-js",()=>({createClient:()=>({auth:{getUser}})}));
import { account } from "../../server/account";
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
test("server authorization rejects unverified tokens and MFA downgrade",async()=>{
  vi.stubEnv("VITE_SUPABASE_URL","https://example.supabase.co");vi.stubEnv("VITE_SUPABASE_ANON_KEY","public-key");
  const request=(aal:string)=>new Request("https://example.com",{headers:{Authorization:`Bearer header.${Buffer.from(JSON.stringify({aal})).toString("base64url")}.signature`}});
  getUser.mockResolvedValue({error:Error("Invalid JWT"),data:{user:null}});
  expect(await account(request("aal2"))).toBeNull();
  getUser.mockResolvedValue({error:null,data:{user:{id:"verified-owner",factors:[{status:"verified"}]}}});
  expect(await account(request("aal1"))).toBeNull();
  expect(await account(request("aal2"))).toBe("verified-owner");
});
