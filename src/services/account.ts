import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const accountClient = url && key ? createClient(url, key, { auth: { storageKey: "nexus-tools-session", detectSessionInUrl: false } }) : null;
export async function accessToken() {
  if (!accountClient) throw new Error("Account service is not configured");
  const { data, error } = await accountClient.auth.getSession();
  if (error || !data.session) throw new Error("Sign in required");
  const aal = await accountClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.error || (aal.data.nextLevel === "aal2" && aal.data.currentLevel !== "aal2")) throw new Error("Complete MFA first");
  return data.session.access_token;
}
