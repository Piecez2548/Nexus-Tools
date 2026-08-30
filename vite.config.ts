import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 5174, strictPort: true },
  test: { environment: "jsdom", setupFiles: ["./src/tests/setup.ts"], exclude: ["**/node_modules/**", "**/e2e/**"] },
});
