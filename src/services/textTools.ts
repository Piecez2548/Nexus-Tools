import { ToolError } from "./errors";
export type TextAction =
  | "upper"
  | "lower"
  | "trim"
  | "dedupe"
  | "json"
  | "url-encode"
  | "url-decode"
  | "base64-encode"
  | "base64-decode"
  | "compare";
export function transformText(
  input: string,
  action: TextAction,
  other = "",
): string {
  if (input.length > 100000 || other.length > 100000)
    throw new ToolError("size");
  try {
    switch (action) {
      case "upper":
        return input.toLocaleUpperCase();
      case "lower":
        return input.toLocaleLowerCase();
      case "trim":
        return input
          .split(/\r?\n/)
          .map((x) => x.trim().replace(/[\t ]+/g, " "))
          .join("\n")
          .trim();
      case "dedupe":
        return [...new Set(input.split(/\r?\n/))].join("\n");
      case "json":
        return JSON.stringify(JSON.parse(input), null, 2);
      case "url-encode":
        return encodeURIComponent(input);
      case "url-decode":
        return decodeURIComponent(input);
      case "base64-encode":
        return btoa(
          Array.from(new TextEncoder().encode(input), (x) =>
            String.fromCharCode(x),
          ).join(""),
        );
      case "base64-decode":
        return new TextDecoder("utf-8", { fatal: true }).decode(
          Uint8Array.from(atob(input.replace(/\s/g, "")), (x) =>
            x.charCodeAt(0),
          ),
        );
      case "compare": {
        if (input === other) return "Identical / ข้อความเหมือนกัน";
        const a = input.split(/\r?\n/),
          b = other.split(/\r?\n/);
        return Array.from({ length: Math.max(a.length, b.length) }, (_, i) =>
          a[i] === b[i]
            ? `  ${i + 1}: ${a[i]}`
            : `${a[i] === undefined ? "" : `− ${i + 1}: ${a[i]}\n`}${b[i] === undefined ? "" : `+ ${i + 1}: ${b[i]}`}`,
        ).join("\n");
      }
    }
  } catch {
    throw new ToolError("text");
  }
}
export type QrKind = "text" | "wifi" | "email" | "phone" | "contact";
const qrEscape = (value: string) =>
  value.replace(/[\\;,:"]/g, "\\$&").replace(/[\r\n]/g, " ");
const vcardEscape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/[,;]/g, "\\$&");
export function qrPayload(kind: QrKind, fields: Record<string, string>) {
  const {
    text = "",
    name = "",
    password = "",
    security = "WPA",
    email = "",
    phone = "",
    subject = "",
    body = "",
    organization = "",
  } = fields;
  switch (kind) {
    case "text":
      return text;
    case "wifi":
      if (!name.trim() || !["WPA", "WEP", "nopass"].includes(security))
        throw new ToolError("qr");
      return `WIFI:T:${security};S:${qrEscape(name)};P:${security === "nopass" ? "" : qrEscape(password)};;`;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ToolError("qr");
      return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    case "phone":
      if (!/^\+?[\d ()-]{3,30}$/.test(phone)) throw new ToolError("qr");
      return `tel:${phone.replace(/[ ()-]/g, "")}`;
    case "contact":
      if (!name.trim()) throw new ToolError("qr");
      return `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${vcardEscape(name)}\r\nORG:${vcardEscape(organization)}\r\nTEL:${vcardEscape(phone)}\r\nEMAIL:${vcardEscape(email)}\r\nEND:VCARD`;
  }
}
