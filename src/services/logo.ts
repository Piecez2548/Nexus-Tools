import { editImage, defaultImageOptions, abortCheck } from "./imageTools";
import { ToolError } from "./errors";
export async function prepareLogo(file: File, signal: AbortSignal) {
  const result = await editImage(
    file,
    { ...defaultImageOptions, width: 320 },
    signal,
  );
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ToolError("image"));
    reader.readAsDataURL(result.blob);
  });
  abortCheck(signal);
  if (url.length > 1000000) throw new ToolError("size");
  return url;
}
