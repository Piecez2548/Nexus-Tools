import { useLanguageStore } from "@/shared/languageStore";
export default function DropFiles({
  files,
  onChange,
  accept,
  multiple = false,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
}) {
  const th = useLanguageStore((s) => s.language) === "th";
  const add = (incoming: File[]) => {
    if (!disabled)
      onChange(
        multiple ? [...files, ...incoming].slice(0, 21) : incoming.slice(0, 1),
      );
  };
  return (
    <>
      <label
        className="file-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(Array.from(e.dataTransfer.files));
        }}
      >
        <strong>
          {th ? "เลือกไฟล์ หรือลากไฟล์มาวาง" : "Choose files or drop them here"}
        </strong>
        <span>
          {multiple
            ? th
              ? "สูงสุด 20 ไฟล์ รวม 50 MB • รูปภาพไฟล์ละ 20 MB"
              : "Up to 20 files, 50 MB total • Images 20 MB each"
            : th
              ? "เลือกหนึ่งไฟล์ • ดูข้อจำกัดของแต่ละเครื่องมือด้านล่าง"
              : "Choose one file • See this tool’s limits below"}
        </span>
        <input
          aria-label={th ? "เลือกไฟล์" : "Choose files"}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <ol className="file-list">
          {files.map((f, i) => (
            <li key={`${i}-${f.name}`}>
              <span>
                {i + 1}. {f.name}
              </span>
              {multiple && (
                <>
                  <button
                    type="button"
                    disabled={disabled || i === 0}
                    aria-label={`Move up ${f.name}`}
                    onClick={() => {
                      const next = [...files];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      onChange(next);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={disabled || i === files.length - 1}
                    aria-label={`Move down ${f.name}`}
                    onClick={() => {
                      const next = [...files];
                      [next[i + 1], next[i]] = [next[i], next[i + 1]];
                      onChange(next);
                    }}
                  >
                    ↓
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
                onClick={() => onChange(files.filter((_, n) => n !== i))}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
