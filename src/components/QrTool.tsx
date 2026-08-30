import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { qrPayload, type QrKind } from "../services/textTools";
import { generateQr } from "../services/files";
import { useToolRunner } from "../hooks/useToolRunner";
import ResultPanel from "./ResultPanel";
export default function QrTool() {
  const th = useLanguageStore((s) => s.language) === "th";
  const [kind, setKind] = useState<QrKind>("text"),
    [fields, setFields] = useState<Record<string, string>>({ security: "WPA" }),
    [format, setFormat] = useState("svg");
  const runner = useToolRunner();
  const labels: Record<string, [string, string]> = {
    text: ["Text or link", "ข้อความหรือลิงก์"],
    url: kind === "image" ? ["Image sharing link (HTTPS)", "ลิงก์แชร์รูปภาพ (HTTPS)"] : ["Video sharing link (HTTPS)", "ลิงก์แชร์วิดีโอ (HTTPS)"],
    name:
      kind === "wifi"
        ? ["Network name (SSID)", "ชื่อเครือข่าย (SSID)"]
        : ["Full name", "ชื่อเต็ม"],
    password: ["Password", "รหัสผ่าน"],
    email: ["Email", "อีเมล"],
    phone: ["Phone", "เบอร์โทร"],
    subject: ["Subject", "หัวข้อ"],
    body: ["Message", "ข้อความ"],
    organization: ["Organization", "องค์กร"],
  };
  const keys =
    kind === "image" || kind === "video"
      ? ["url"]
      : kind === "text"
      ? ["text"]
      : kind === "wifi"
        ? ["name", ...(fields.security === "nopass" ? [] : ["password"])]
        : kind === "email"
          ? ["email", "subject", "body"]
          : kind === "phone"
            ? ["phone"]
            : ["name", "organization", "email", "phone"];
  return (
    <>
      <form
        onChange={runner.reset}
        onSubmit={(e) => {
          e.preventDefault();
          void runner.run(() => generateQr(qrPayload(kind, fields), format));
        }}
      >
        <fieldset className="tool-fields" disabled={runner.busy}>
          <label className="field">
            {th ? "ประเภท QR" : "QR type"}
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as QrKind);
                setFields({ security: "WPA" });
              }}
            >
              {[
                ["text", "Text / URL"],
                ["image", th ? "รูปภาพ" : "Image"],
                ["video", th ? "วิดีโอ" : "Video"],
                ["wifi", "Wi-Fi"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["contact", "vCard"],
              ].map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {kind === "wifi" && (
            <label className="field">
              {th ? "ความปลอดภัย Wi-Fi" : "Wi-Fi security"}
              <select
                value={fields.security}
                onChange={(e) =>
                  setFields({ ...fields, security: e.target.value })
                }
              >
                <option>WPA</option>
                <option>WEP</option>
                <option value="nopass">Open / ไม่มีรหัส</option>
              </select>
            </label>
          )}
          {keys.map((key) => (
            <label className="field" key={key}>
              {labels[key][th ? 1 : 0]}
              {key === "text" || key === "body" ? (
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={fields[key] ?? ""}
                  onChange={(e) =>
                    setFields({ ...fields, [key]: e.target.value })
                  }
                />
              ) : (
                <input
                  type={key === "password" ? "password" : key === "url" ? "url" : "text"}
                  required={key === "url"}
                  placeholder={key === "url" ? "https://…" : undefined}
                  maxLength={key === "url" ? 1000 : 300}
                  value={fields[key] ?? ""}
                  onChange={(e) =>
                    setFields({ ...fields, [key]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
          {(kind === "image" || kind === "video") && (
            <div className="field-hint">
              <p>{th
                ? "สแกน QR แล้วเปิดลิงก์รูปภาพหรือวิดีโอ ต้องเชื่อมต่ออินเทอร์เน็ต และอาจต้องแตะเปิดลิงก์หรือกดเล่นตามแอปที่สแกน"
                : "Scanning opens your image or video link. Internet is required; the scanner may ask you to open the link or press play."}</p>
              <p>{th
                ? "อัปโหลดสื่อไปยังบริการที่คุณใช้อยู่ก่อน เช่น Google Drive หรือ YouTube แล้ววางลิงก์แชร์ HTTPS ตั้งสิทธิ์ให้ผู้ที่มีลิงก์ดูได้ และลองเปิดในหน้าต่างไม่ระบุตัวตนก่อนแจก QR"
                : "Upload media to your preferred host, such as Google Drive or YouTube, then paste its HTTPS sharing link. Allow viewers with the link and test it in a private browser window before sharing the QR."}</p>
              <p>{th
                ? "Nexus Tools ไม่อัปโหลดหรือเก็บไฟล์สื่อ QR เก็บเฉพาะลิงก์ ผู้มี QR เข้าถึงสื่อได้ตามสิทธิ์ที่คุณตั้ง หากลบไฟล์ เปลี่ยนสิทธิ์ หรือลิงก์หมดอายุ QR จะเปิดสื่อไม่ได้"
                : "Nexus Tools does not upload or store media. The QR contains only the link; access follows your sharing permissions. Deleting the file, changing access or an expired link can stop it working."}</p>
            </div>
          )}
          <label className="field">
            {th ? "รูปแบบไฟล์" : "Output format"}
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="svg">SVG</option>
              <option value="png">PNG</option>
            </select>
          </label>
          <p className="field-hint">
            {th
              ? "ผู้ที่สแกน QR จะเห็นข้อมูลที่ใส่ รวมรหัส Wi-Fi • ไม่บันทึกข้อมูล"
              : "Anyone scanning the QR can read its contents, including Wi-Fi passwords. Inputs are not saved."}
          </p>
          <button className="button">
            {th ? "สร้างไฟล์" : "Generate file"}
          </button>
        </fieldset>
      </form>
      <ResultPanel runner={runner} />
      {runner.result && (kind === "image" || kind === "video") && (
        <a className="button secondary" href={fields.url.trim()} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
          {th ? "เปิดลิงก์สื่อเพื่อตรวจสอบ" : "Open media link to check"}
        </a>
      )}
    </>
  );
}
