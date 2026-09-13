import { useEffect, useState } from "react";
import { accountClient } from "../services/account";
import { authenticate, initializeAccount, refreshAccount, useAccount, verifyAccountCode } from "../services/authState";
import { syncBook } from "../services/cloudBook";
import { useLanguageStore } from "@/shared/languageStore";

export default function AccountPanel({ expanded = false }: { expanded?: boolean }) {
  const th = useLanguageStore(s => s.language) === "th";
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [code, setCode] = useState("");
  const [signup, setSignup] = useState(false), [verify, setVerify] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const { email: user, factor, unavailable } = useAccount();
  useEffect(() => { void initializeAccount(); }, []);
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setMessage(""); setFailed(false);
    try { await work(); }
    catch { setFailed(true); setMessage(th ? "ดำเนินการไม่สำเร็จ โปรดตรวจอีเมล รหัสผ่าน หรือรหัสยืนยัน แล้วลองใหม่ หากร้องขอบ่อยเกินไปให้รอสักครู่" : "Unable to complete. Check your email, password or verification code and retry. If rate limited, wait a moment."); }
    finally { setBusy(false); }
  };
  const content = <>
    {!accountClient ? <p role="alert">{th ? "ยังไม่ได้ตั้งค่าบริการบัญชี กรุณาติดต่อผู้ดูแลระบบ" : "Account service is not configured. Please contact the administrator."}</p> : <>
      {unavailable && <p role="alert">{th ? "ตรวจสอบบัญชีไม่ได้ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง" : "Could not verify your account. Check your connection and retry."} <button type="button" onClick={() => void run(refreshAccount)}>{th ? "ลองใหม่" : "Retry"}</button></p>}
      <form onSubmit={e => { e.preventDefault(); void run(async () => {
        if (factor || verify) { await verifyAccountCode(email, code, factor); setCode(""); setVerify(false); }
        else { const result = await authenticate(email, password, signup); setPassword(""); setVerify(result === "verify"); }
      }); }}>
        <fieldset disabled={busy} className="tool-fields">
          {!user && !factor && !verify && <>
            <h2>{signup ? (th ? "สมัครสมาชิก" : "Create an account") : (th ? "เข้าสู่ระบบ" : "Sign in")}</h2>
            <label className="field">{th ? "อีเมล" : "Email"}<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label className="field">{th ? "รหัสผ่าน" : "Password"}<input required minLength={signup ? 8 : undefined} type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
            {signup && <p className="field-hint">{th ? "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร บัญชีนี้ใช้ร่วมกับ Nexus All ได้" : "Use at least 8 characters. This account also works with Nexus All."}</p>}
            <button className="button" type="submit">{signup ? (th ? "สมัครสมาชิก" : "Create account") : (th ? "เข้าสู่ระบบ" : "Sign in")}</button>
            <button type="button" onClick={() => { setSignup(!signup); setPassword(""); setMessage(""); }}>{signup ? (th ? "มีบัญชีแล้ว — เข้าสู่ระบบ" : "Already registered? Sign in") : (th ? "ยังไม่มีบัญชี — สมัครสมาชิก" : "New here? Create an account")}</button>
          </>}
          {!user && (factor || verify) && <>
            <h2>{factor ? (th ? "ยืนยันตัวตน 2 ขั้นตอน" : "Two-factor verification") : (th ? "ยืนยันอีเมล" : "Verify your email")}</h2>
            <p>{factor ? (th ? "กรอกรหัสจากแอปยืนยันตัวตน" : "Enter the code from your authenticator app.") : (th ? `กรอกรหัสที่ส่งไปยัง ${email} ตรวจกล่องจดหมายขยะด้วย` : `Enter the code sent to ${email}. Check your spam folder too.`)}</p>
            <label className="field">{th ? "รหัสยืนยัน" : "Verification code"}<input required inputMode="numeric" autoComplete="one-time-code" maxLength={factor ? 6 : 10} value={code} onChange={e => setCode(e.target.value)} /></label>
            <button className="button" type="submit">{th ? "ยืนยัน" : "Verify"}</button>
            {verify && <><button type="button" onClick={() => void run(async () => { const { error } = await accountClient!.auth.resend({ type: "signup", email: email.trim() }); if (error) throw error; setMessage(th ? "ส่งรหัสแล้ว โปรดตรวจอีเมล" : "Code sent. Check your email."); })}>{th ? "ส่งรหัสอีกครั้ง" : "Resend code"}</button><button type="button" onClick={() => { setVerify(false); setCode(""); }}>{th ? "เปลี่ยนอีเมล / กลับ" : "Change email / Back"}</button></>}
          </>}
          {user && <><p>{user}</p><p className="field-hint">{th ? "ซิงก์สมุดลูกค้า สินค้า ประวัติและตัวนับเลขเอกสารของเครื่องนี้กับบัญชีนี้ด้วยตนเอง ข้อมูลไม่ได้เข้ารหัสแบบ end-to-end โปรดสำรองก่อนซิงก์ การออกจากบัญชีไม่ลบข้อมูลในเครื่อง" : "Manually sync this browser’s contacts, products, document history and counters with this account. Not end-to-end encrypted. Back up first. Signing out keeps local business data."}</p><button type="button" onClick={() => { if (confirm(th ? `รวมข้อมูลธุรกิจบนเครื่องนี้เข้าบัญชี ${user}?` : `Merge this browser’s business data into ${user}?`)) void run(async () => { await syncBook(); setMessage(th ? "ซิงก์สำเร็จ" : "Synced"); }); }}>{th ? "ซิงก์ข้อมูลธุรกิจ" : "Sync business data"}</button></>}
          {(user || factor) && <button type="button" onClick={() => void run(async () => { const { error } = await accountClient!.auth.signOut({ scope: "local" }); if (error) throw error; })}>{th ? "ออกจากระบบ" : "Sign out"}</button>}
        </fieldset>
      </form>
    </>}
    <a className="account-link" href="https://nexus-lemon-eight-32.vercel.app/projects" target="_blank" rel="noopener noreferrer">{th ? "เปิด Nexus All / กู้คืนรหัสผ่าน" : "Open Nexus All / Recover password"}</a>
    <p role={failed ? "alert" : "status"}>{busy ? (th ? "กำลังดำเนินการ…" : "Working…") : message}</p>
  </>;
  return expanded ? <section className="account-panel">{content}</section> : <details className="account-panel"><summary>{th ? "บัญชี Nexus / ซิงก์ข้อมูล" : "Nexus account / Cloud sync"}</summary>{content}</details>;
}
