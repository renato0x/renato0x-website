export type Theme = "light" | "dark";

export const themeStorageKey = "renato0x-portfolio-theme-v1";
export const lightThemeQuery = "(prefers-color-scheme: light)";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

// Run in the head so a saved preference takes effect before the body paints.
export const themeBootstrap = `(() => {
  let theme;
  try { theme = localStorage.getItem(${JSON.stringify(themeStorageKey)}); } catch {}
  document.documentElement.dataset.theme = theme === "light" || theme === "dark"
    ? theme
    : matchMedia(${JSON.stringify(lightThemeQuery)}).matches ? "light" : "dark";
})();`;
