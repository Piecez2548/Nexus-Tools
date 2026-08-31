import { useEffect, useState } from "react";
import { accountClient } from "../services/account";
import { syncBook } from "../services/cloudBook";
import { useLanguageStore } from "@/shared/languageStore";

export default function AccountPanel() {
  const th = useLanguageStore(s => s.language) === "th";
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [code, setCode] = useState("");
  const [user, setUser] = useState(""), [factor, setFactor] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  useEffect(() => {
    if (!accountClient) return;
    let live = true;
    const refresh = async () => {
      const session = await accountClient!.auth.getSession();
      if (!session.data.session) { if (live) { setUser(""); setFactor(""); } return; }
      const aal = await accountClient!.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.error) { if (live) setUser(""); return; }
      if (aal.data.nextLevel === "aal2" && aal.data.currentLevel !== "aal2") {
        const factors = await accountClient!.auth.mfa.listFactors();
        if (live) { setFactor(factors.data?.totp[0]?.id ?? ""); setUser(""); }
      } else if (live) { setFactor(""); setUser(session.data.session.user.email ?? "Nexus"); }
    };
    void refresh();
    const { data } = accountClient.auth.onAuthStateChange(() => { setTimeout(() => void refresh(), 0); });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  const run = async (work: () => Promise<void>) => { setBusy(true); setMessage(""); try { await work(); } catch { setMessage(th ? "ดำเนินการไม่สำเร็จ ตรวจบัญชี รหัสยืนยัน หรือเลขเอกสารที่ขัดแย้ง ข้อมูลในเครื่องยังอยู่" : "Unable to complete. Check credentials, verification code or conflicting document numbers. Local data is preserved."); } finally { setBusy(false); } };
  return <details className="account-panel"><summary>{th ? "บัญชี Nexus / ซิงก์ข้อมูล" : "Nexus account / Cloud sync"}</summary>
    {!accountClient ? <p>{th ? "ยังไม่ได้ตั้งค่าบริการบัญชี ใช้เครื่องมือในเครื่องได้ตามปกติ" : "Account service is not configured. Local tools remain available."}</p> : <fieldset disabled={busy} className="tool-fields">
      {!user && !factor && <><label className="field">Email<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label><label className="field">{th ? "รหัสผ่าน Nexus" : "Nexus password"}<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label><button type="button" onClick={() => void run(async () => { const { error } = await accountClient!.auth.signInWithPassword({ email, password }); setPassword(""); if (error) throw error; })}>{th ? "เข้าสู่ระบบ" : "Sign in"}</button><p>{th ? "ใช้บัญชี Nexus เดิม สมัครบัญชีและกู้คืนรหัสผ่านได้ที่ Nexus หลัก" : "Use your existing Nexus account. Register or recover your password in Nexus."}</p></>}
      {factor && <><label className="field">{th ? "รหัสยืนยัน 2 ขั้นตอน" : "Two-factor code"}<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></label><button type="button" onClick={() => void run(async () => { const { error } = await accountClient!.auth.mfa.challengeAndVerify({ factorId: factor, code }); setCode(""); if (error) throw error; })}>{th ? "ยืนยัน" : "Verify"}</button></>}
      {user && <><p>{user}</p><p className="field-hint">{th ? "กดซิงก์เพื่อรวมสมุดลูกค้า สินค้า ประวัติและตัวนับเลขเอกสารของเครื่องนี้กับบัญชีนี้บนคลาวด์ ข้อมูลไม่ได้เข้ารหัสแบบ end-to-end สำรองก่อนซิงก์ ไม่ซิงก์อัตโนมัติ หากต้องการเลขไม่ซ้ำข้ามเครื่อง ให้ใช้ปุ่มจองเลขบนคลาวด์ในฟอร์มเอกสาร" : "Sync merges this browser’s contacts, products, document history and counters into this account’s cloud book. Not end-to-end encrypted. Back up first. Sync is manual. Use the document form’s cloud reservation button for unique numbers across devices."}</p><button type="button" onClick={() => { if (confirm(th ? `รวมข้อมูลธุรกิจบนเครื่องนี้เข้าบัญชี ${user}?` : `Merge this browser’s business data into ${user}?`)) void run(async () => { await syncBook(); setMessage(th ? "ซิงก์สำเร็จ" : "Synced"); }); }}>{th ? "ซิงก์ข้อมูลธุรกิจ" : "Sync business data"}</button></>}
      {(user || factor) && <button type="button" onClick={() => void run(async () => { const { error } = await accountClient!.auth.signOut({ scope: "local" }); if (error) throw error; setMessage(th ? "ออกจากบัญชีแล้ว ข้อมูลธุรกิจเดิมยังอยู่บนเบราว์เซอร์นี้" : "Signed out. Local business data remains in this browser."); })}>{th ? "ออกจากระบบ" : "Sign out"}</button>}
    </fieldset>}<a href="https://nexus-lemon-eight-32.vercel.app" target="_blank" rel="noopener noreferrer">{th ? "เปิด Nexus หลัก ↗" : "Open Nexus ↗"}</a><p role="status">{busy ? (th ? "กำลังดำเนินการ…" : "Working…") : message}</p>
  </details>;
}
