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
    kind === "text"
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
                  type={key === "password" ? "password" : "text"}
                  maxLength={300}
                  value={fields[key] ?? ""}
                  onChange={(e) =>
                    setFields({ ...fields, [key]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
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
    </>
  );
}
