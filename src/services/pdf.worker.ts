import { processPdf } from "./pdf";
import { ToolError } from "./errors";
self.onmessage = async (
  event: MessageEvent<{
    files: File[];
    mode: "merge-pdf" | "split-pdf";
    selection: string;
  }>,
) => {
  try {
    const { files, mode, selection } = event.data;
    if (
      files.length > 20 ||
      files.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024
    )
      throw new ToolError("size");
    self.postMessage(
      await processPdf(
        await Promise.all(files.map((file) => file.arrayBuffer())),
        mode,
        selection,
      ),
    );
  } catch (error) {
    self.postMessage({
      error: error instanceof ToolError ? error.code : "pdf",
    });
  }
};

