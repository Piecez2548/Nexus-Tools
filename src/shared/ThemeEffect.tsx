import { useLayoutEffect } from "react";
import { useToolsPreferences } from "../store";

// Apply the saved preference outside AuthGate so login and shared media use it too.
export function ThemeEffect() {
  const theme = useToolsPreferences((state) => state.theme);
  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.toolsTheme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.classList.toggle("mono", theme === "mono");
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return null;
}
