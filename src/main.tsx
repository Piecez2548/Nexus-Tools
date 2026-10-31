import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import ToolsApp from "./ToolsApp";
import { ThemeEffect } from "./shared/ThemeEffect";
import { installStaleChunkReload } from "./shared/staleChunkReload";
import "./tools.css";

// The shared-media page is rarely opened, so its code and the account client load on demand.
const MediaViewer = lazy(() => import("./components/MediaViewer"));

installStaleChunkReload();

// Lets pages and tools that were opened before work offline. See public/sw.js.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeEffect />
    {new URLSearchParams(location.search).has("media") ? (
      <Suspense fallback={null}>
        <MediaViewer id={new URLSearchParams(location.search).get("media")!} />
      </Suspense>
    ) : (
      <ToolsApp />
    )}
  </StrictMode>,
);

