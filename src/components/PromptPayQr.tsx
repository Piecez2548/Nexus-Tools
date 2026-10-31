import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { generateQr } from "../services/files";
import { ToolError } from "../services/errors";
import { parseMoney } from "../services/thaiTools";
import { promptPayPayload } from "../services/promptPay";
import { useToolRunner } from "../hooks/useToolRunner";
import ResultPanel from "./ResultPanel";

export default function PromptPayQr() {
  const th = useLanguageStore((s) => s.language) === "th";
  const [phone, setPhone] = useState(""),
    [amount, setAmount] = useState("");
  const runner = useToolRunner();
  return (
    <>
      <form
        onChange={runner.reset}
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run(async () => {
            let cents: bigint;
            try {
              cents = parseMoney(amount, "promptpay");
            } catch {
              throw new ToolError("promptpay");
            }
            const result = await generateQr(promptPayPayload(phone, Number(cents)), "png");
            return { ...result, filename: "nexus-promptpay.png" };
          });
        }}
      >
        <fieldset className="tool-fields" disabled={runner.busy}>
          <label className="field">
            {th ? "เบอร์มือถือที่ผูกพร้อมเพย์" : "PromptPay mobile number"}
            <input inputMode="tel" autoComplete="off" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="081-234-5678" />
          </label>
          <label className="field">
            {th ? "จำนวนเงิน (บาท)" : "Amount (baht)"}
            <input inputMode="decimal" autoComplete="off" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="250.00" />
          </label>
          <p className="field-hint">
            {th
              ? "สร้าง QR พร้อมเพย์แบบระบุเบอร์มือถือและจำนวนเงินคงที่ ไม่ตรวจกับธนาคาร ผู้จ่ายควรเห็นชื่อผู้รับในแอปธนาคารและตรวจให้ตรงก่อนโอน"
              : "Creates a PromptPay QR for a mobile number and a fixed amount. It is not verified with any bank. The payer should check the recipient name shown in their banking app before paying."}
          </p>
          <button className="button">{th ? "สร้าง QR พร้อมเพย์" : "Create PromptPay QR"}</button>
        </fieldset>
      </form>
      <ResultPanel runner={runner} />
    </>
  );
}
