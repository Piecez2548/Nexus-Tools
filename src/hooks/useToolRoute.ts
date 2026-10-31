import { useCallback, useEffect, useRef, useState } from "react";
import { workSavedEvent } from "@/shared/download";
import { toolFromPath, toolPath, type Tool } from "../catalog";

const homeTitle = "Nexus Tools — Your everyday toolkit";

/** Keeps the open tool in the URL so it can be linked, reloaded and closed with Back. */
export function useToolRoute(toolTitle: (tool: Tool) => string, leaveMessage: string) {
  const [activeTool, setActiveTool] = useState(() => toolFromPath(location.pathname));
  const activeRef = useRef(activeTool);
  activeRef.current = activeTool;
  const dirty = useRef(false);
  const markDirty = useCallback(() => { dirty.current = true; }, []);

  const openTool = useCallback((tool: Tool) => {
    dirty.current = false;
    history.pushState(null, "", toolPath(tool.id));
    setActiveTool(tool);
  }, []);
  const closeTool = useCallback(() => {
    dirty.current = false;
    history.pushState(null, "", "/");
    setActiveTool(null);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const current = activeRef.current;
      const next = toolFromPath(location.pathname);
      if (next?.id === current?.id) return;
      // The browser has already moved, so staying means returning to the tool's address.
      if (current && dirty.current && !window.confirm(leaveMessage)) {
        history.pushState(null, "", toolPath(current.id));
        return;
      }
      dirty.current = false;
      setActiveTool(next);
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    const onWorkSaved = () => { dirty.current = false; };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener(workSavedEvent, onWorkSaved);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener(workSavedEvent, onWorkSaved);
    };
  }, [leaveMessage]);

  useEffect(() => {
    document.title = activeTool ? `${toolTitle(activeTool)} | Nexus Tools` : homeTitle;
  }, [activeTool, toolTitle]);

  return { activeTool, openTool, closeTool, markDirty };
}
