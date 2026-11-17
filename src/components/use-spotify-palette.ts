"use client";

import { useEffect, useRef } from "react";
import { extractSpotifyColors } from "@/lib/spotify-palette";
import type { SpotifyColors } from "@/lib/spotify-palette";
import { spotifyPaletteStorageKey } from "@/lib/theme";

type CoverPalette = { cover: string; colors: SpotifyColors };
const primary = "--spotify-primary";
const secondary = "--spotify-secondary";
const paletteCache = new Map<string, Promise<SpotifyColors>>();

function loadCoverPalette(cover: string) {
  const saved = paletteCache.get(cover);
  if (saved) return saved;

  const request = new Promise<SpotifyColors>((resolve, reject) => {
    const image = new Image();
    const fail = () => {
      clearTimeout(timeout);
      image.onload = image.onerror = null;
      reject(new Error("Album artwork unavailable"));
    };
    const timeout = window.setTimeout(fail, 6000);
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        const ratio = 48 / Math.max(image.naturalWidth, image.naturalHeight);
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(extractSpotifyColors(context.getImageData(0, 0, canvas.width, canvas.height).data));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = fail;
    image.src = cover;
  });

  if (paletteCache.size >= 24) {
    const oldest = paletteCache.keys().next().value;
    if (oldest) paletteCache.delete(oldest);
  }
  paletteCache.set(cover, request);
  void request.catch(() => { if (paletteCache.get(cover) === request) paletteCache.delete(cover); });
  return request;
}

export function useSpotifyPalette(cover: string | undefined, live: boolean) {
  const latest = useRef<CoverPalette | null>(null);
  const publish = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(spotifyPaletteStorageKey) ?? "null");
      const hex = /^#[a-f0-9]{6}$/i;
      if (typeof stored?.cover === "string" && typeof stored.colors?.primary === "string" &&
          typeof stored.colors.secondary === "string" && hex.test(stored.colors.primary) && hex.test(stored.colors.secondary)) {
        latest.current = stored;
      }
    } catch {
      // The neutral theme works with unavailable or invalid browser storage.
    }

    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | null = null;
    const currentColors = () => {
      const css = getComputedStyle(root);
      return { [primary]: css.getPropertyValue(primary).trim(), [secondary]: css.getPropertyValue(secondary).trim() };
    };
    const writeColors = (colors: ReturnType<typeof currentColors>) => {
      root.style.setProperty(primary, colors[primary]);
      root.style.setProperty(secondary, colors[secondary]);
    };
    const stop = () => {
      animation?.cancel();
      animation = null;
      root.dataset.spotifyPalette = "ready";
    };
    const apply = () => {
      if (!latest.current || root.hasAttribute("data-theme-wave")) return;
      const colors = latest.current.colors;
      if (!animation && root.style.getPropertyValue(primary) === colors.primary &&
          root.style.getPropertyValue(secondary) === colors.secondary) return;

      const interpolate = root.dataset.theme === "spotify" && !document.hidden && !reduced.matches &&
        typeof root.animate === "function" && typeof CSS.registerProperty === "function";
      const from = interpolate ? currentColors() : null;
      stop();
      const to = { [primary]: colors.primary, [secondary]: colors.secondary };
      writeColors(to);
      if (!from) return;

      const transition = root.animate([from, to], { duration: 1550, easing: "ease-in-out" });
      animation = transition;
      root.dataset.spotifyPalette = "moving";
      transition.onfinish = () => { if (animation === transition) stop(); };
    };
    const followTheme = () => {
      if (root.hasAttribute("data-theme-wave")) {
        if (animation) {
          writeColors(currentColors());
          stop();
        }
        return;
      }
      apply();
    };
    const followMotion = () => {
      if ((reduced.matches || document.hidden) && animation) stop();
      followTheme();
    };

    publish.current = apply;
    apply();
    const observer = new MutationObserver(followTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-theme-wave"] });
    reduced.addEventListener("change", followMotion);
    document.addEventListener("visibilitychange", followMotion);
    return () => {
      publish.current = null;
      stop();
      observer.disconnect();
      reduced.removeEventListener("change", followMotion);
      document.removeEventListener("visibilitychange", followMotion);
    };
  }, []);

  useEffect(() => {
    if (!cover || latest.current?.cover === cover || (!live && latest.current)) return;
    let stale = false;

    void loadCoverPalette(cover).then((colors) => {
      if (stale) return;
      const palette = { cover, colors };
      latest.current = palette;
      try { localStorage.setItem(spotifyPaletteStorageKey, JSON.stringify(palette)); } catch {}
      publish.current?.();
    }, () => {});

    return () => { stale = true; };
  }, [cover, live]);
}
