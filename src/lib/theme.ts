export const themes = ["light", "dark", "spotify"] as const;
export type Theme = (typeof themes)[number];

export const themeStorageKey = "renato0x-portfolio-theme-v1";
export const spotifyPaletteStorageKey = "renato0x-spotify-palette-v1";
export const lightThemeQuery = "(prefers-color-scheme: light)";
export const asciiIntroStorageKey = "renato0x-ascii-intro-v1";

export function isTheme(value: unknown): value is Theme {
  return themes.some((theme) => theme === value);
}

// Run in the head so a saved preference takes effect before the body paints.
export const themeBootstrap = `(() => {
  let theme;
  try { theme = localStorage.getItem(${JSON.stringify(themeStorageKey)}); } catch {}
  const root = document.documentElement;
  root.dataset.theme = ${JSON.stringify(themes)}.includes(theme)
    ? theme
    : matchMedia(${JSON.stringify(lightThemeQuery)}).matches ? "light" : "dark";
  try {
    const colors = JSON.parse(localStorage.getItem(${JSON.stringify(spotifyPaletteStorageKey)}))?.colors;
    const hex = /^#[a-f0-9]{6}$/i;
    if (typeof colors?.primary === "string" && typeof colors?.secondary === "string" &&
        hex.test(colors.primary) && hex.test(colors.secondary)) {
      root.style.setProperty("--spotify-primary", colors.primary);
      root.style.setProperty("--spotify-secondary", colors.secondary);
    }
  } catch {}
  try {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !sessionStorage.getItem(${JSON.stringify(asciiIntroStorageKey)})) {
      root.dataset.asciiIntro = "pending";
      setTimeout(() => {
        if (root.dataset.asciiIntro === "pending") delete root.dataset.asciiIntro;
      }, 1200);
    }
  } catch {}
})();`;
