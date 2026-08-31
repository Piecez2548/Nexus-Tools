import { useState } from "react";
import { parseBackup, mergeBooks, backupLimit } from "../services/bookBackup";
import { readBook, writeBook, type Book } from "../services/documentBook";
export default function RestoreBackup({ th }: { th: boolean }) {
  const [pending, setPending] = useState<Book | null>(null), [message, setMessage] = useState("");
  return <div className="tool-fields"><label className="field">{th ? "กู้คืนข้อมูลสำรอง JSON (รวมกับข้อมูลเดิม)" : "Restore JSON backup (merge with existing data)"}<input type="file" accept=".json,application/json" onChange={async e => {
    const file = e.target.files?.[0]; setPending(null); setMessage(""); e.target.value = "";
    if (!file) return;
    try { if (file.size > backupLimit) throw new Error(); setPending(parseBackup(await file.text())); }
    catch { setMessage(th ? "ไฟล์ไม่ถูกต้อง รุ่นไม่รองรับ หรือเกิน 10 MB ข้อมูลเดิมยังอยู่" : "Invalid/unsupported backup or over 10 MB. Existing data is unchanged."); }
  }} /></label>{pending && <><p>{th ? "พร้อมรวมข้อมูล" : "Ready to merge"}: {pending.documents.length} {th ? "เอกสาร" : "documents"}, {pending.customers.length} {th ? "ลูกค้า" : "customers"}</p><button type="button" onClick={async () => {
    try {
      const restore = () => writeBook(mergeBooks(readBook(), pending));
      if (navigator.locks) await navigator.locks.request("nexus-document-book", restore); else restore();
      setPending(null); setMessage(th ? "กู้คืนสำเร็จ ไม่ทับเอกสารเดิม" : "Backup restored without overwriting existing documents.");
    } catch { setMessage(th ? "รวมไม่ได้: เลขเอกสารขัดแย้ง ข้อมูลเต็ม หรือพื้นที่ไม่พอ ข้อมูลเดิมยังอยู่" : "Cannot merge: conflicting document, capacity or storage limit. Existing data is unchanged."); }
  }}>{th ? "ยืนยันกู้คืน" : "Confirm restore"}</button><button type="button" onClick={() => setPending(null)}>{th ? "ยกเลิก" : "Cancel"}</button></>}<p role="status">{message}</p></div>;
}
