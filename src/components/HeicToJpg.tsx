import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { heicToJpeg } from "../services/heic";
import { useToolRunner } from "../hooks/useToolRunner";
import { ToolError } from "../services/errors";
import DropFiles from "./DropFiles";
import ResultPanel from "./ResultPanel";

export default function HeicToJpg() {
  const th = useLanguageStore((s) => s.language) === "th";
  const [files, setFiles] = useState<File[]>([]),
    [quality, setQuality] = useState(0.9);
  const runner = useToolRunner();
  return (
    <>
      <form
        onChange={runner.reset}
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run((signal) => (files.length ? heicToJpeg(files, quality, signal) : Promise.reject(new ToolError("files"))));
        }}
      >
        <fieldset className="tool-fields" disabled={runner.busy}>
          <DropFiles
            files={files}
            onChange={(value) => {
              setFiles(value);
              runner.reset();
            }}
            accept=".heic,.heif,image/heic,image/heif"
            multiple
            disabled={runner.busy}
          />
          <p className="field-hint">
            {th
              ? "ภาพ HEIC/HEIF จาก iPhone ไฟล์ละไม่เกิน 30 MB และ 24 ล้านพิกเซล สูงสุด 20 ไฟล์ รวม 50 MB หลายไฟล์จะได้เป็น ZIP แปลงเฉพาะภาพนิ่งหลัก (ไม่รวมวิดีโอของ Live Photo) และข้อมูล EXIF/ตำแหน่งจะไม่ถูกคัดลอกไปยังไฟล์ใหม่"
              : "HEIC/HEIF photos from an iPhone, up to 30 MB and 24 megapixels each, 20 files and 50 MB in total. Several files download as one ZIP. Only the main still image is converted (no Live Photo video), and EXIF/location data is not copied to the new file."}
          </p>
          <label className="field">
            {th ? "คุณภาพ JPEG" : "JPEG quality"}
            <select value={quality} onChange={(event) => setQuality(Number(event.target.value))}>
              <option value={0.95}>{th ? "สูงมาก" : "Very high"}</option>
              <option value={0.9}>{th ? "สูง" : "High"}</option>
              <option value={0.8}>{th ? "สมดุล" : "Balanced"}</option>
              <option value={0.65}>{th ? "ไฟล์เล็ก" : "Smaller file"}</option>
            </select>
          </label>
          <button className="button" disabled={!files.length}>
            {th ? "แปลงเป็น JPG" : "Convert to JPG"}
          </button>
        </fieldset>
      </form>
      <ResultPanel runner={runner} />
    </>
  );
}
