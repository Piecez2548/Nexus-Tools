import { create } from "zustand";
import { accountClient } from "./account";
import { receiveNexusSession } from "./sso";

interface AuthState { ready: boolean; email: string; factor: string; unavailable: boolean }
export const useAccount = create<AuthState>(() => ({ ready: false, email: "", factor: "", unavailable: false }));
let initialization: Promise<void> | undefined;
let revision = 0;

export async function refreshAccount() {
  const current = ++revision;
  const next: AuthState = { ready: true, email: "", factor: "", unavailable: false };
  try {
    if (accountClient) {
      const session = await accountClient.auth.getSession();
      if (session.error) throw session.error;
      if (session.data.session) {
        const user = await accountClient.auth.getUser(session.data.session.access_token);
        if (user.error || !user.data.user) throw user.error;
        const aal = await accountClient.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal.error) throw aal.error;
        if ((aal.data.nextLevel === "aal2" || user.data.user.factors?.some(f => f.status === "verified")) && aal.data.currentLevel !== "aal2") {
          next.factor = user.data.user.factors?.find(f => f.status === "verified" && f.factor_type === "totp")?.id ?? "";
          if (!next.factor) throw new Error("MFA unavailable");
        } else next.email = user.data.user.email ?? user.data.user.id;
      }
    }
  } catch { next.unavailable = true; }
  if (current === revision) useAccount.setState(next);
}

export function initializeAccount() {
  return initialization ??= (async () => {
    await receiveNexusSession();
    accountClient?.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        ++revision;
        useAccount.setState({ ready: true, email: "", factor: "", unavailable: false });
      } else setTimeout(() => void refreshAccount(), 0);
    });
    await refreshAccount();
  })();
}

export async function authenticate(email: string, password: string, signup: boolean) {
  if (!accountClient) throw new Error("Account service unavailable");
  if (signup) {
    const { data, error } = await accountClient.auth.signUp({ email: email.trim(), password });
    if (error) throw error;
    if (!data.session) return "verify";
  } else {
    const { error } = await accountClient.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }
  await refreshAccount();
  return "done";
}

export async function verifyAccountCode(email: string, token: string, factor: string) {
  if (!accountClient) throw new Error("Account service unavailable");
  const { error } = factor
    ? await accountClient.auth.mfa.challengeAndVerify({ factorId: factor, code: token.trim() })
    : await accountClient.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "signup" });
  if (error) throw error;
  await refreshAccount();
}
