// Excel on Windows guesses a UTF-8 CSV with no byte-order mark is ANSI,
// which garbles anything outside plain ASCII (Thai text, etc.) into
// mojibake — prefixing the BOM makes it detect UTF-8 correctly.
const UTF8_BOM = "﻿";

export function downloadFile(filename: string, content: string | Blob, mimeType: string) {
  const body = typeof content === "string" && mimeType.startsWith("text/csv") ? UTF8_BOM + content : content;
  const blob = new Blob([body], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  // WebKit can start consuming the Blob asynchronously after click();
  // revoking in the same turn can cancel the download before it begins.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
