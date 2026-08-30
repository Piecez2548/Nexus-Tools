import { useEffect, useState } from "react";
import { mediaIdPattern } from "../services/media";
export default function MediaViewer({id}:{id:string}) {
  const [failed,setFailed]=useState(!mediaIdPattern.test(id));
  useEffect(()=>{const meta=document.createElement("meta");meta.name="robots";meta.content="noindex,nofollow";document.head.append(meta);return()=>meta.remove();},[]);
  const src=`/api/media?id=${encodeURIComponent(id)}`;
  return <main className="media-viewer"><h1>Nexus Tools · สื่อที่แชร์</h1>{failed?<p role="alert">เปิดสื่อไม่ได้ ลิงก์อาจถูกลบหรือการเชื่อมต่อขัดข้อง / Media unavailable.</p>:/\.(mp4|webm)$/.test(id)?<video controls playsInline preload="metadata" src={src} onError={()=>setFailed(true)} />:<img src={src} alt="รูปภาพที่แชร์ / Shared image" onError={()=>setFailed(true)} />}<p>ผู้มีลิงก์นี้สามารถดูสื่อได้ / Anyone with this link can view this media.</p><a href="/">กลับไป Nexus Tools</a></main>;
}
