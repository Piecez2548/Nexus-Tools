import RestoreBackup from "./RestoreBackup";
import { exportBackup } from "../services/bookBackup";
import { useState, useEffect } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { readBook, saveContacts, clearContacts, deleteDocument, suggestNumber, type DocumentKind } from "../services/documentBook";
import type { Invoice } from "../services/invoice";
import { downloadFile } from "@/shared/download";
export default function DocumentBook({ invoice, onLoad }: { invoice: Invoice; onLoad: (v: Invoice) => void }) {
  const th = useLanguageStore(s => s.language) === "th";
  const [book, setBook] = useState(readBook), [query, setQuery] = useState(""), [message, setMessage] = useState("");
  const refresh = () => setBook(readBook());
  useEffect(()=>{const update=()=>setBook(readBook());window.addEventListener("nexus-book-changed",update);window.addEventListener("storage",update);return()=>{window.removeEventListener("nexus-book-changed",update);window.removeEventListener("storage",update);};},[]);
  const act = (fn: () => void) => { try { fn(); refresh(); setMessage(th ? "บันทึกแล้ว" : "Saved"); } catch { setMessage(th ? "จัดเก็บไม่ได้ กรุณาสำรองข้อมูลและตรวจพื้นที่" : "Storage unavailable. Back up and check space."); } };
  return <details onToggle={refresh}><summary>{th ? "สมุดลูกค้า / สินค้า / ประวัติเอกสาร" : "Customers, products and document history"}</summary>
    <p className="field-hint">{th ? "บันทึกบนเบราว์เซอร์นี้ สูงสุด 100 เอกสาร กู้คืน JSON ได้ ซิงก์ข้ามเครื่องผ่านเมนูบัญชี Nexus เมื่อยืนยันเท่านั้น สำรองก่อนล้างข้อมูล" : "Stored in this browser. Maximum 100 documents. Restore JSON or explicitly sync through Nexus account. Back up before clearing browser data."}</p>
    <div className="settings-history"><button type="button" onClick={() => act(() => saveContacts(invoice))}>{th ? "บันทึกผู้ขาย ลูกค้า และรายการนี้" : "Save contacts and products"}</button><button type="button" onClick={() => act(() => downloadFile("nexus-business-backup.json", exportBackup(readBook()), "application/json"))}>{th ? "สำรองข้อมูล JSON" : "Export backup JSON"}</button><button type="button" onClick={() => { if (confirm(th ? "ลบสมุดลูกค้าและสินค้า? ประวัติเอกสารยังอยู่" : "Clear contacts/products? Document history stays.")) act(clearContacts); }}>{th ? "ล้างสมุดข้อมูล" : "Clear address book"}</button></div>
    <RestoreBackup th={th} />
    {book.seller && <button type="button" onClick={() => onLoad({...invoice, seller:book.seller})}>{th ? "ใช้ผู้ขายที่บันทึก" : "Use saved seller"}</button>}
    <label className="field">{th ? "เลือกลูกค้า" : "Saved customer"}<select value="" onChange={e => onLoad({...invoice, customer:book.customers[Number(e.target.value)]})}><option value="">—</option>{book.customers.map((c,i)=><option key={i} value={i}>{c.slice(0,100)}</option>)}</select></label>
    <label className="field">{th ? "เพิ่มสินค้าที่บันทึก" : "Saved product"}<select value="" disabled={invoice.items.length >= 30} onChange={e => onLoad({...invoice, items:[...invoice.items.filter(i=>i.description.trim()), {...book.products[Number(e.target.value)]}]})}><option value="">—</option>{book.products.map((p,i)=><option key={i} value={i}>{p.description.slice(0,70)} · {p.price}</option>)}</select></label>
    <label className="field">{th ? "ค้นหาเอกสาร" : "Search documents"}<input value={query} onChange={e=>setQuery(e.target.value)} /></label>
    {book.documents.filter(d => `${d.document.number} ${d.document.customer}`.toLowerCase().includes(query.toLowerCase())).map(d=><div key={d.id} className="settings-history"><span>{d.document.number} · {d.document.customer.slice(0,35)}</span><button type="button" onClick={()=>onLoad(d.document)}>{th ? "เปิด" : "Load"}</button>{(["quotation","invoice","receipt"] as DocumentKind[]).map(kind=><button type="button" key={kind} onClick={()=>onLoad({...d.document, kind, number:suggestNumber(kind,invoice.date), sourceNumber:d.document.number, paidConfirmed:false, promptPayConfirmed:false})}>{th ? {quotation:"เป็นใบเสนอราคา",invoice:"เป็นใบแจ้งหนี้",receipt:"เป็นใบเสร็จ"}[kind] : `Copy as ${kind}`}</button>)}<button type="button" onClick={()=>{if(confirm(th ? `ลบ ${d.document.number}?` : `Delete ${d.document.number}?`)) act(()=>deleteDocument(d.id));}}>{th ? "ลบ" : "Delete"}</button></div>)}
    <p role="status">{message}</p>
  </details>;
}
