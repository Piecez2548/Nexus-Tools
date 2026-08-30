import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { uploadMedia, listMedia, deleteMedia, mediaLink, type MediaEntry } from "../services/media";
import { formatBytes } from "../services/files";
export default function MediaUpload({kind,onSelect}:{kind:"image"|"video";onSelect:(url:string)=>void}) {
  const th=useLanguageStore(s=>s.language)==="th";
  const [key,setKey]=useState(""),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState(false),[files,setFiles]=useState<MediaEntry[]>([]),[cursor,setCursor]=useState<string|null>(null),[message,setMessage]=useState("");
  const run=async(operation:()=>Promise<void>)=>{setBusy(true);setError(false);setMessage("");try{await operation();}catch{setError(true);}finally{setBusy(false);}};
  return <details><summary>{th?"อัปโหลดและจัดการสื่อ Nexus":"Upload and manage Nexus media"}</summary>
    <p className="field-hint">{th?"ส่วนนี้ส่งไฟล์ไปยังพื้นที่จัดเก็บบน Vercel ต้องใช้รหัสผู้ดูแล สูงสุด 50 MB/ไฟล์ ผู้มีลิงก์หรือ QR จะดูได้ ไม่ควรอัปโหลดข้อมูลลับ ลบไฟล์เพื่อปิดลิงก์ได้ แต่ไม่สามารถเรียกคืนสำเนาที่ผู้อื่นดาวน์โหลดไปแล้ว":"This uploads to Vercel storage. An administrator key is required. Up to 50 MB/file. Anyone with the link or QR can view it: do not upload secrets. Delete to disable the link; copies already downloaded cannot be recalled."}</p>
    <fieldset disabled={busy} className="tool-fields">
      <label className="field">{th?"รหัสผู้ดูแลสื่อ (ไม่บันทึก)":"Media administrator key (not saved)"}<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} /></label>
      <button type="button" onClick={()=>{setKey("");setFiles([]);setCursor(null);}}>{th?"ล้างรหัสจากหน้านี้":"Clear key from this page"}</button>
      <label className="field">{th?"เลือกสื่อเพื่ออัปโหลด":"Choose media to upload"}<input type="file" accept={kind==="image"?"image/jpeg,image/png,image/webp":"video/mp4,video/webm"} onChange={e=>setFile(e.target.files?.[0]??null)} /></label>
      <button type="button" className="button secondary" disabled={!key||!file} onClick={()=>void run(async()=>{setProgress(0);const pathname=await uploadMedia(file!,key,setProgress);onSelect(mediaLink(pathname));setMessage(th?"อัปโหลดแล้ว กดสร้างไฟล์เพื่อรับ QR":"Uploaded. Generate the file to get your QR.");})}>{th?"อัปโหลดและใช้ลิงก์นี้":"Upload and use link"}</button>
      <button type="button" className="button secondary" disabled={!key} onClick={()=>void run(async()=>{const result=await listMedia(key);setFiles(result.files);setCursor(result.cursor);setMessage(th?`พบ ${result.files.length} ไฟล์ในหน้านี้`:`${result.files.length} files on this page`);})}>{th?"แสดงสื่อที่จัดเก็บ":"List stored media"}</button>
      {files.map(entry=><div className="settings-history" key={entry.pathname}><span>{entry.pathname.slice(6,18)}…{entry.pathname.slice(-5)} · {formatBytes(entry.size)} · {new Date(entry.uploadedAt).toLocaleDateString()}</span><button type="button" onClick={()=>onSelect(mediaLink(entry.pathname))}>{th?"ใช้ลิงก์":"Use link"}</button><a href={mediaLink(entry.pathname)} target="_blank" rel="noreferrer">{th?"ดูสื่อ":"View"}</a><button type="button" onClick={()=>{if(confirm(th?"ลบไฟล์นี้? QR เดิมจะเปิดไม่ได้อีก":"Delete this file? Existing QR links will stop working."))void run(async()=>{await deleteMedia(key,entry.pathname);setFiles(files.filter(f=>f.pathname!==entry.pathname));setMessage(th?"ลบแล้ว":"Deleted");});}}>{th?"ลบ":"Delete"}</button></div>)}
      {cursor&&<button type="button" onClick={()=>void run(async()=>{const result=await listMedia(key,cursor);setFiles([...files,...result.files]);setCursor(result.cursor);})}>{th?"โหลดเพิ่มเติม":"Load more"}</button>}
    </fieldset>
    <p role="status">{busy?`${th?"กำลังทำงาน":"Working"} ${progress}%`:message}</p>
    {error&&<p role="alert" className="tool-error">{th?"ดำเนินการไม่สำเร็จ ตรวจรหัสผู้ดูแล ชนิดไฟล์ ขนาดไม่เกิน 50 MB และการเชื่อมต่อ":"Unable to complete. Check the administrator key, file type, 50 MB limit and connection."}</p>}
  </details>;
}
