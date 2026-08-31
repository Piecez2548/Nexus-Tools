import { accountClient } from "./account";

export const nexusOrigin = "https://nexus-lemon-eight-32.vercel.app";

/** Only an explicitly opened Nexus window can deliver a session. Tokens never enter URLs. */
export function receiveNexusSession(): Promise<void> {
  const url = new URL(location.href);
  const nonce = url.searchParams.get("nexus_sso");
  url.searchParams.delete("nexus_sso");
  history.replaceState(null, "", url);
  const opener = window.opener as Window | null;
  if (!nonce || !/^[a-f0-9]{64}$/.test(nonce) || !opener || !accountClient) return Promise.resolve();
  return new Promise(resolve => {
    let consumed = false;
    const finish = () => {
      clearInterval(interval); clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      window.opener = null;
      resolve();
    };
    const onMessage = (event: MessageEvent) => {
      if (consumed || event.origin !== nexusOrigin || event.source !== opener || event.data?.nonce !== nonce || event.data?.type !== "nexus:session") return;
      const { access_token, refresh_token } = event.data;
      if (typeof access_token !== "string" || typeof refresh_token !== "string" || access_token.length > 8192 || refresh_token.length > 8192) return;
      consumed = true;
      clearInterval(interval);
      // AuthGate subsequently verifies the user with Supabase and enforces MFA.
      void accountClient!.auth.setSession({ access_token, refresh_token }).then(finish, finish);
    };
    window.addEventListener("message", onMessage);
    const ready = () => opener.postMessage({ type: "nexus:ready", nonce }, nexusOrigin);
    const interval = setInterval(ready, 500);
    const timeout = setTimeout(finish, 15_000);
    ready();
  });
}
