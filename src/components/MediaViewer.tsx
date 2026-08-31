import { useEffect, useState } from "react";
import { mediaIdPattern } from "../services/media";
import AccountPanel from "./AccountPanel";
import { accessToken } from "../services/account";
export default function MediaViewer({id}:{id:string}) {
  const [failed,setFailed]=useState(!mediaIdPattern.test(id));
  const [attempt,setAttempt]=useState(0),[message,setMessage]=useState("");
  useEffect(()=>{const meta=document.createElement("meta");meta.name="robots";meta.content="noindex,nofollow";document.head.append(meta);return()=>meta.remove();},[]);
  const src=`/api/media?id=${encodeURIComponent(id)}&attempt=${attempt}`;
  if (failed && id.startsWith("media/v2/") && mediaIdPattern.test(id)) return <main className="media-viewer"><h1>Nexus Tools · สื่อที่แชร์</h1><p role="alert">สื่ออาจจำกัดเฉพาะเจ้าของ หมดอายุ หรือถูกลบแล้ว</p><AccountPanel /><button type="button" onClick={async()=>{try{const token=await accessToken();const response=await fetch(`/api/media-access?id=${encodeURIComponent(id)}`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw new Error();setAttempt(v=>v+1);setFailed(false);}catch{setMessage("เปิดไม่ได้ กรุณาใช้บัญชีเจ้าของ หรือติดต่อผู้ส่งลิงก์");}}}>ยืนยันบัญชีและเปิดสื่อ / Verify account and open</button><p role="status">{message}</p><a href="/">กลับไป Nexus Tools</a></main>;
  return <main className="media-viewer"><h1>Nexus Tools · สื่อที่แชร์</h1>{failed?<p role="alert">เปิดสื่อไม่ได้ ลิงก์อาจถูกลบหรือการเชื่อมต่อขัดข้อง / Media unavailable.</p>:/\.(mp4|webm)$/.test(id)?<video controls playsInline preload="metadata" src={src} onError={()=>setFailed(true)} />:<img src={src} alt="รูปภาพที่แชร์ / Shared image" onError={()=>setFailed(true)} />}<p>สิทธิ์ดูสื่อและวันหมดอายุกำหนดโดยผู้ส่ง / Access and expiry are set by the sender.</p><a href="/">กลับไป Nexus Tools</a></main>;
}
