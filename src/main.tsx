import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MediaViewer from "./components/MediaViewer";
import ToolsApp from "./ToolsApp";
import { ThemeEffect } from "./shared/ThemeEffect";
import "./tools.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeEffect />
    {new URLSearchParams(location.search).has("media") ? <MediaViewer id={new URLSearchParams(location.search).get("media")!} /> : <ToolsApp />}
  </StrictMode>,
);

