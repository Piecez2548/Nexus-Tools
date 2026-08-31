import { ToolError } from "./errors.js";
const field = (id: string, value: string) => id + String(value.length).padStart(2,"0") + value;
export function crc16(value: string) {
  let crc = 0xffff;
  for (const c of new TextEncoder().encode(value)) { crc ^= c << 8; for (let i=0;i<8;i++) crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff; }
  return crc.toString(16).toUpperCase().padStart(4,"0");
}
/** Thai QR PromptPay credit transfer, phone proxy, fixed THB amount. No bank verification. */
export function promptPayPayload(phone: string, cents: number) {
  const digits = phone.replace(/[ -]/g, "");
  if (!/^0[689]\d{8}$/.test(digits) || !Number.isSafeInteger(cents) || cents <= 0 || cents > 99999999999) throw new ToolError("promptpay");
  const account = field("00", "A000000677010111") + field("01", "0066" + digits.slice(1));
  const value = field("00","01") + field("01","12") + field("29",account) + field("58","TH") + field("53","764") + field("54",(cents/100).toFixed(2)) + "6304";
  return value + crc16(value);
}
