import { useState } from "react";
import { reserveCloudNumber } from "../services/cloudBook";
import type { DocumentKind } from "../services/documentBook";
export default function CloudNumber({kind,date,onNumber,onBusy,th}:{kind:DocumentKind;date:string;onNumber:(value:string)=>void;onBusy:(value:boolean)=>void;th:boolean}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  return <div><button type="button" className="button secondary" disabled={busy} onClick={async()=>{
    if (!confirm(th?"ส่งสมุดธุรกิจในเครื่องไปซิงก์และจองเลขเอกสารในบัญชี Nexus ที่เข้าสู่ระบบ? เลขที่จองจะไม่ถูกใช้ซ้ำ แม้ยกเลิกเอกสาร":"Sync this browser’s business book and reserve a number in your signed-in Nexus account? Reserved numbers are never reused, even if you cancel.")) return;
    setBusy(true);onBusy(true);setMessage("");try{onNumber(await reserveCloudNumber(kind,date));setMessage(th?"จองเลขแล้ว":"Number reserved");}catch{setMessage(th?"จองไม่ได้ กรุณาเข้าสู่ระบบ ตรวจการเชื่อมต่อหรือเอกสารที่ขัดแย้ง":"Cannot reserve. Sign in and check connection or conflicting documents.");}finally{setBusy(false);onBusy(false);}
  }}>{th?"จองเลขเอกสารบนคลาวด์":"Reserve cloud document number"}</button><p role="status">{message}</p></div>;
}
