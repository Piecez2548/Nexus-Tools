import { createClient } from "@supabase/supabase-js";

// Supabase verifies the access token remotely; never trust a user id from the client.
export async function account(request: Request, header = "authorization"): Promise<string | null> {
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
  const token = request.headers.get(header)?.match(/^Bearer (.+)$/)?.[1];
  if (!url || !key || !token || token.length > 8192) return null;
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    // Decode only AFTER getUser has verified the token. Enrolled MFA requires aal2.
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    if (data.user.factors?.some(f => f.status === "verified") && claims.aal !== "aal2") return null;
    return data.user.id;
  } catch { return null; }
}
