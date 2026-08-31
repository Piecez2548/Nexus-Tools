import { useEffect, type ReactNode } from "react";
import { initializeAccount, useAccount } from "../services/authState";
import { useLanguageStore } from "@/shared/languageStore";
import AccountPanel from "./AccountPanel";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { ready, email } = useAccount();
  const th = useLanguageStore(s => s.language) === "th";
  useEffect(() => { void initializeAccount(); }, []);
  if (ready && email) return children;
  return <main className="auth-page">
    <header><h1>Nexus Tools</h1><p>{th ? "เข้าสู่ระบบเพื่อเริ่มใช้งานเครื่องมือของคุณ" : "Sign in to use your tools"}</p></header>
    {!ready ? <p role="status">{th ? "กำลังตรวจสอบบัญชี…" : "Checking your account…"}</p> : <AccountPanel expanded />}
    <p className="field-hint">{th ? "ใช้บัญชีเดียวกับ Nexus All หากเปิด Tools จากเมนู Nexus All ระบบจะเชื่อมบัญชีให้โดยอัตโนมัติ" : "Use the same account as Nexus All. Launch Tools from its menu to connect your session automatically."}</p>
  </main>;
}
