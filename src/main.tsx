import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ToolsApp from "./ToolsApp";
import "./tools.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToolsApp />
  </StrictMode>,
);

