import { useState } from "react";
import { readLocal, saveLocal, removeLocal } from "../services/localData";
import { useLanguageStore } from "@/shared/languageStore";
export default function SettingsHistory<T extends object>({
  id,
  value,
  onRestore,
}: {
  id: string;
  value: T;
  onRestore: (v: T) => void;
}) {
  const th = useLanguageStore((s) => s.language) === "th";
  const [items, setItems] = useState<T[]>(() => {
    const data = readLocal<unknown>("settings-" + id, []);
    return Array.isArray(data)
      ? data.slice(0, 5).filter((v) => v && typeof v === "object")
      : [];
  });
  const [message, setMessage] = useState("");
  return (
    <div className="settings-history">
      <button
        type="button"
        className="button secondary"
        onClick={() => {
          const next = [value, ...items].slice(0, 5);
          if (saveLocal("settings-" + id, next)) {
            setItems(next);
            setMessage(th ? "บันทึกการตั้งค่าแล้ว" : "Settings saved");
          } else
            setMessage(th ? "พื้นที่จัดเก็บไม่พร้อม" : "Storage unavailable");
        }}
      >
        {th ? "บันทึกการตั้งค่า" : "Save settings"}
      </button>
      {items.map((item, i) => (
        <button
          type="button"
          key={i}
          className="button secondary"
          onClick={() => {
            const restored = { ...value };
            for (const key of Object.keys(value) as (keyof T)[])
              if (typeof item[key] === typeof value[key])
                restored[key] = item[key];
            onRestore(restored);
          }}
        >
          {th ? "ใช้ชุด" : "Restore"} {i + 1}
        </button>
      ))}
      {items.length > 0 && (
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            if (removeLocal("settings-" + id)) setItems([]);
          }}
        >
          {th ? "ล้างประวัติตั้งค่า" : "Clear settings history"}
        </button>
      )}
      <small role="status">{message}</small>
    </div>
  );
}
