import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toolCatalog } from "./catalog";

interface ToolsPreferences {
  favorites: string[];
  recent: string[];
  recordRecent: (id: string) => void;
  clearRecent: () => void;
  theme: "dark" | "light" | "system" | "mono";
  toggleFavorite: (id: string) => void;
  toggleTheme: () => void;
}
export const useToolsPreferences = create<ToolsPreferences>()(
  persist(
    (set) => ({
      favorites: [],
      recent: [],
      recordRecent: (id) =>
        set((state) => ({
          recent: [id, ...state.recent.filter((v) => v !== id)].slice(0, 8),
        })),
      clearRecent: () => set({ recent: [] }),
      theme: "dark",
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((value) => value !== id)
            : [...state.favorites, id],
        })),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "nexus-tools-preferences",
      merge: (persisted, current) => {
        const saved = persisted as Partial<ToolsPreferences> | undefined;
        return {
          ...current,
          recent: Array.isArray(saved?.recent)
            ? saved.recent
                .filter((id) => toolCatalog.some((t) => t.id === id))
                .slice(0, 8)
            : [],
          theme: saved?.theme === "light" || saved?.theme === "mono" || saved?.theme === "system" ? saved.theme : "dark",
          favorites: Array.isArray(saved?.favorites)
            ? saved.favorites.filter((id) =>
                toolCatalog.some((tool) => tool.id === id),
              )
            : [],
        };
      },
    },
  ),
);
