"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { createPortal, flushSync } from "react-dom";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { CodeLeafText } from "@/components/ui/code-leaf";
import type { CodeLeafMark } from "@/components/ui/code-leaf";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { asciiIntroStorageKey, isTheme, lightThemeQuery, themeStorageKey } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { PortfolioCursor } from "@/components/ui/portfolio-cursor";
import { introLogs, introTiming } from "@/lib/portfolio-intro";
import { version as portfolioVersion } from "../../package.json";

type Language = "pt" | "en";
type ProjectName = "CashPad" | "Transcrypty" | "SUB-SEEMG";
type TrackSource = "spotify" | "discord" | "recent" | "stored" | "cached";

type Track = {
  title: string;
  artist: string;
  cover: string;
  source: TrackSource;
};

const profileDisplayName = "Renato Monteiro";
const profileAlias = "renato0x";
const pageTitle = "renato0x";

type Project = {
  name: ProjectName;
  fallbackStars: number;
  fallbackCommits: number;
  meta: Record<Language, string>;
  logo: string;
  href: string;
  description: Record<Language, string>;
};

type PageCopy = {
  title: string;
  content: string;
  about: string;
  bio: readonly [string, string];
  bioHighlights: readonly CodeLeafMark[];
  technologies: string;
  technologyList: string;
  projects: string;
  openProject: (name: string) => string;
  githubStars: string;
  githubCommits: string;
  profile: string;
  socialLinks: string;
  spotify: string;
  noPlayback: string;
  noRecentTrack: string;
  noRecentArtist: string;
  lastPlayed: string;
  listening: string;
  viaDiscord: string;
};

const languageKey = "renato0x-portfolio-language-v2";
const lastTrackKey = "renato0x-portfolio-last-track-v1";
const starsKeyPrefix = "renato0x-github-stars-";
const commitsKeyPrefix = "renato0x-github-commits-";

const projects: Project[] = [
  {
    name: "SUB-SEEMG",
    fallbackStars: 0,
    fallbackCommits: 27,
    meta: { pt: "C#", en: "C#" },
    logo: "/assets/projects/SUB-SEEMG.png",
    href: "https://github.com/renato0x/SUB-SEEMG",
    description: {
      pt: "Desenvolvimento do sistema bibliotecário oficial do Estado de Minas Gerais.",
      en: "Development of the official library system for the State of Minas Gerais.",
    },
  },
  {
    name: "CashPad",
    fallbackStars: 1,
    fallbackCommits: 28,
    meta: { pt: "JavaScript", en: "JavaScript" },
    logo: "/assets/projects/CashPad.svg",
    href: "https://github.com/renato0x/CashPad",
    description: {
      pt: "Organiza despesas compartilhadas de forma simples e direta.",
      en: "A simple way to keep shared household expenses organized.",
    },
  },
  {
    name: "Transcrypty",
    fallbackStars: 3,
    fallbackCommits: 14,
    meta: { pt: "Python", en: "Python" },
    logo: "/assets/projects/Transcrypty.bmp",
    href: "https://github.com/renato0x/Transcrypty",
    description: {
      pt: "Transcrição de voz rápida e privada para Windows, com processamento local.",
      en: "Fast, private speech-to-text for Windows, processed locally.",
    },
  },
];

const copy: Record<Language, PageCopy> = {
  pt: {
    title: pageTitle,
    content: "Conteúdo do portfólio",
    about: "Sobre renato0x",
    bio: [
      "Sou Renato, tenho 18 anos e estudo Análise e Desenvolvimento de Sistemas no IFNMG, em Montes Claros. Sempre fui de mexer em tudo que envolvia tecnologia, principalmente computadores e programação. A curiosidade de entender como as coisas funcionam acabou me levando a fazer cursos na área, criar meus próprios projetos e aprender muita coisa por conta própria.",
      "Atualmente, faço estágio em suporte de TI, mas continuo mexendo com programação no meu tempo livre. Gosto de testar coisas novas, entender o que estou fazendo e ir atrás das respostas quando alguma coisa não funciona como deveria.",
    ],
    bioHighlights: [
      { term: "IFNMG", description: "Instituto Federal do Norte de Minas Gerais" },
    ],
    technologies: "Tecnologias usadas",
    technologyList: "Tecnologias",
    projects: "Projetos",
    openProject: (name: string) => `Abrir o repositório ${name} no GitHub`,
    githubStars: "Estrelas no GitHub",
    githubCommits: "commits de renato0x no GitHub",
    profile: "Perfil",
    socialLinks: "Redes sociais",
    spotify: "Spotify",
    noPlayback: "inativa",
    noRecentTrack: "Nenhuma faixa recente",
    noRecentArtist: "A próxima reprodução aparecerá aqui",
    lastPlayed: "ouvida por último",
    listening: "agora",
    viaDiscord: "via Discord",
  },
  en: {
    title: pageTitle,
    content: "Portfolio content",
    about: "About renato0x",
    bio: [
      "I'm Renato, I'm 18, and I study Systems Analysis and Development at IFNMG in Montes Claros. I've always liked tinkering with anything to do with technology, especially computers and programming. Wanting to understand how things work led me to take courses in the field, build my own projects, and learn a lot on my own.",
      "I'm currently an IT support intern, and I keep coding in my free time. I like trying new things, understanding what I'm doing, and looking for answers when something doesn't work the way it should.",
    ],
    bioHighlights: [
      { term: "IFNMG", description: "Federal Institute of Northern Minas Gerais" },
    ],
    technologies: "Technologies",
    technologyList: "Technologies",
    projects: "Projects",
    openProject: (name: string) => `Open the ${name} repository on GitHub`,
    githubStars: "GitHub stars",
    githubCommits: "commits authored by renato0x",
    profile: "Profile",
    socialLinks: "Social links",
    spotify: "Spotify",
    noPlayback: "idle",
    noRecentTrack: "No recent track",
    noRecentArtist: "Your next play will appear here",
    lastPlayed: "last played",
    listening: "now",
    viaDiscord: "via Discord",
  },
};

function LocaleSwap({
  children,
  className = "",
  block = false,
  ready,
  transitionId,
  highlightTerms = [],
}: {
  children: string;
  className?: string;
  block?: boolean;
  ready: boolean;
  transitionId: number;
  highlightTerms?: readonly CodeLeafMark[];
}) {
  const reduceMotion = useReducedMotion();
  const [activeTransition, setActiveTransition] = useState(0);
  const completedTransition = useRef(0);
  const slotClass = `locale-slot${block ? " locale-slot--block" : ""}${className ? ` ${className}` : ""}`;
  const textClass = `locale-swap${block ? " locale-swap--block" : ""}`;

  useLayoutEffect(() => {
    if (!ready || reduceMotion || transitionId === 0) return;

    if (completedTransition.current !== transitionId) {
      completedTransition.current = transitionId;
      setActiveTransition(transitionId);
    }

    const timeout = window.setTimeout(() => {
      setActiveTransition((current) => current === transitionId ? 0 : current);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [ready, reduceMotion, transitionId]);

  if (!ready || reduceMotion || activeTransition !== transitionId || transitionId === 0) {
    return (
      <span className={slotClass}>
        <span className={textClass}>
          <CodeLeafText text={children} terms={highlightTerms} />
        </span>
      </span>
    );
  }

  return (
    <span className={slotClass}>
      <EncryptedText
        key={transitionId}
        text={children}
        highlightTerms={highlightTerms}
        className={`${textClass} locale-settle`}
        revealMode="organic"
        revealDurationMs={900}
        scrambleRatio={0.2}
        flipDelayMs={150}
        glitchIntervalMs={0}
        charset=".:=+*#@"
        encryptedClassName="scrambled-text"
      />
    </span>
  );
}

const stackItems = [
  ["Next.js", "/assets/stack/nextdotjs.svg"],
  ["TypeScript", "/assets/stack/typescript.svg"],
  ["C#", "/assets/stack/csharp.svg"],
  ["JavaScript", "/assets/stack/javascript.svg"],
  ["Firebase", "/assets/stack/firebase.svg"],
  ["Python", "/assets/stack/python.svg"],
  ["Tailwind CSS", "/assets/stack/tailwindcss.svg"],
  ["Vercel", "/assets/stack/vercel.svg"],
  ["NumPy", "/assets/stack/numpy.svg"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCachedTrack(): Track | null {
  try {
    const raw = window.localStorage.getItem(lastTrackKey);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      typeof value.title !== "string" ||
      typeof value.artist !== "string" ||
      typeof value.cover !== "string" ||
      !value.cover.startsWith("https:")
    ) {
      return null;
    }
    return { title: value.title, artist: value.artist, cover: value.cover, source: "cached" };
  } catch {
    return null;
  }
}

function getLinkUrl(linkHeader: string | null, relation: "last" | "next") {
  const match = linkHeader?.match(new RegExp(`<([^>]+)>;\\s*rel="${relation}"`, "i"));
  return match?.[1] ?? null;
}

async function getAuthorCommitCount(projectName: ProjectName, signal: AbortSignal) {
  const firstPage = new URL(`https://api.github.com/repos/renato0x/${encodeURIComponent(projectName)}/commits`);
  firstPage.searchParams.set("author", "renato0x");
  firstPage.searchParams.set("per_page", "1");
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

  const response = await fetch(firstPage, { headers, signal });
  if (!response.ok) throw new Error("GitHub commit count unavailable");

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("Unexpected GitHub commit response");

  const lastPage = getLinkUrl(response.headers.get("Link"), "last");
  if (lastPage) {
    const count = Number(new URL(lastPage).searchParams.get("page"));
    if (Number.isSafeInteger(count) && count >= 0) return count;
    throw new Error("Invalid GitHub pagination link");
  }

  let count = payload.length;
  let nextPage = getLinkUrl(response.headers.get("Link"), "next");
  while (nextPage) {
    const nextResponse = await fetch(nextPage, { headers, signal });
    if (!nextResponse.ok) throw new Error("GitHub commit count unavailable");

    const nextPayload: unknown = await nextResponse.json();
    if (!Array.isArray(nextPayload)) throw new Error("Unexpected GitHub commit response");

    count += nextPayload.length;
    nextPage = getLinkUrl(nextResponse.headers.get("Link"), "next");
  }

  return count;
}

type ThemeWave = { x: number; y: number; radius: number; startedAt: number };
const themeRevealDuration = 700;
const introStyle = Object.fromEntries(Object.entries(introTiming).map(([key, value]) => [`--intro-${key}`, `${value}ms`])) as CSSProperties;

function IntroOutline() {
  return (
    <svg className="intro-outline" aria-hidden="true" focusable="false">
      <rect pathLength="100" />
    </svg>
  );
}

function AsciiField({ wave, repaint, onIntroStep }: {
  wave: RefObject<ThemeWave | null>;
  repaint: RefObject<(() => void) | null>;
  onIntroStep: (step: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerTargetX = useMotionValue(0);
  const pointerTargetY = useMotionValue(0);
  const pointerX = useSpring(pointerTargetX, { stiffness: 130, damping: 32, mass: 0.55 });
  const pointerY = useSpring(pointerTargetY, { stiffness: 130, damping: 32, mass: 0.55 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const root = document.documentElement;
    const readPalette = () => {
      const style = window.getComputedStyle(root);
      return {
        cloud: style.getPropertyValue("--ascii-cloud").trim(),
        grain: style.getPropertyValue("--ascii-grain").trim(),
        cloudFont: style.getPropertyValue("--ascii-cloud-font").trim(),
        cloudContrast: Number(style.getPropertyValue("--ascii-cloud-contrast")) || 1,
      };
    };
    let palette = readPalette();

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverQuery = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const compactQuery = window.matchMedia("(max-width: 760px)");
    const chars = " .,:;-=+*#%@";
    const dotChars = ".:";
    const wake: Array<{ x: number; y: number; time: number; energy: number }> = [];
    const clickPulses: Array<{ x: number; y: number; startedAt: number }> = [];
    const maskTargets: Array<{ selector: string; strength: number; feather: number }> = [
      { selector: ".bio-block", strength: 0.94, feather: 46 },
      { selector: ".stack-row", strength: 0.68, feather: 26 },
      { selector: ".project-card", strength: 0.79, feather: 14 },
      { selector: ".profile-head, .socials", strength: 0.85, feather: 28 },
      { selector: ".music-card", strength: 0.84, feather: 20 },
      { selector: ".preference-switch", strength: 0.83, feather: 28 },
      { selector: ".portfolio-status-meta, .portfolio-status a", strength: 0.82, feather: 16 },
    ];
    let contentMaskZones: Array<{ left: number; top: number; right: number; bottom: number; strength: number; feather: number }> = [];
    let time = 0;
    let stormElapsed = 0;
    const nextStormInterval = () => 5_500 + Math.random() * 4_500;
    let nextStormFlashAt = nextStormInterval();
    type StormNode = { x: number; y: number; delay: number; duration: number; strength: number; radiusScale: number };
    type StormFlash = { startedAt: number; duration: number; nodes: StormNode[] };
    type ActiveStormNode = { x: number; y: number; radiusSquared: number; envelope: number };
    let stormFlash: StormFlash | null = null;
    const activeStormNodes: ActiveStormNode[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastFrameTime = 0;
    let reduceMotion = motionQuery.matches;
    let finePointer = hoverQuery.matches;
    let lastWakePoint: { x: number; y: number; time: number } | null = null;
    let introStarted = !reduceMotion && !document.hidden && root.dataset.asciiIntro === "pending" ? performance.now() : null;
    let introStep = 0;
    let fieldElement: HTMLElement | null = null;
    let fieldHovered = false;
    let fieldStrength = 0;
    let fieldStarted = 0;

    if (introStarted !== null) {
      root.dataset.asciiIntro = "building";
      onIntroStep(introStep);
      try { sessionStorage.setItem(asciiIntroStorageKey, "1"); } catch { /* The introduction can still run on this view. */ }
    } else if (root.dataset.asciiIntro === "pending") {
      delete root.dataset.asciiIntro;
    }

    const finishIntro = () => {
      introStarted = null;
      root.dataset.asciiIntro = "ready";
      onIntroStep(-1);
    };
    const handleIntroFocus = (event: FocusEvent) => {
      if (introStarted !== null && event.target instanceof Element && event.target.closest(".page")) finishIntro();
    };
    const handleIntroKey = (event: KeyboardEvent) => {
      if (introStarted !== null && event.key === "Escape") finishIntro();
    };

    const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
    const smoothStep = (value: number) => {
      const normalized = clamp(value, 0, 1);
      return normalized * normalized * (3 - 2 * normalized);
    };
    const syncField = (event: PointerEvent) => {
      if (introStarted !== null || reduceMotion || !finePointer || event.pointerType === "touch") return;
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".spotlight-card, .avatar-preview-trigger, .preference-switch button, .socials a, .stack-item, .code-leaf, .portfolio-status a")
        : null;
      const newHover = target && (!fieldHovered || target !== fieldElement);
      fieldHovered = target !== null;
      if (newHover) {
        if (target !== fieldElement) fieldStrength = 0;
        fieldElement = target;
        fieldStarted = performance.now();
      }
    };
    const cellNoise = (column: number, row: number, variant = 0) => {
      const value = Math.sin(column * 127.1 + row * 311.7 + variant * 74.7) * 43758.5453123;
      return value - Math.floor(value);
    };

    const refreshContentMask = () => {
      const canvasBounds = canvas.getBoundingClientRect();
      const compact = compactQuery.matches;
      contentMaskZones = maskTargets.flatMap((target) => Array.from(document.querySelectorAll<HTMLElement>(target.selector)).map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          left: bounds.left - canvasBounds.left,
          top: bounds.top - canvasBounds.top,
          right: bounds.right - canvasBounds.left,
          bottom: bounds.bottom - canvasBounds.top,
          strength: target.strength,
          feather: compact ? Math.min(target.feather, 9) : target.feather,
        };
      }));
    };

    const contentMask = (x: number, y: number) => {
      let visibility = 1;
      for (const zone of contentMaskZones) {
        const outsideX = x < zone.left ? zone.left - x : x > zone.right ? x - zone.right : 0;
        const outsideY = y < zone.top ? zone.top - y : y > zone.bottom ? y - zone.bottom : 0;
        const distance = Math.hypot(outsideX, outsideY);
        if (distance >= zone.feather) continue;

        const influence = 1 - smoothStep(distance / zone.feather);
        visibility *= 1 - zone.strength * influence;
      }
      return visibility;
    };

    const dotWave = { opacity: 0.62, offsetX: 0, offsetY: 0 };
    const sampleDotWave = (x: number, y: number, elapsedSeconds: number) => {
      if (reduceMotion) {
        dotWave.opacity = 0.62;
        dotWave.offsetX = 0;
        dotWave.offsetY = 0;
        return dotWave;
      }

      const normalizedX = x / Math.max(width, 1);
      const normalizedY = y / Math.max(height, 1);
      const cycle = elapsedSeconds * (Math.PI * 2 / 15);
      const primary = Math.sin(normalizedX * 5.8 + normalizedY * 2.8 - cycle);
      const cross = Math.sin(
        normalizedX * -2.1 + normalizedY * 6.2 + cycle * 2 + Math.sin(cycle) * 0.46,
      );
      const ripple = Math.sin((normalizedX + normalizedY) * 8.6 - cycle * 3 + Math.sin(normalizedX * 1.7 - normalizedY * 1.2) * 0.42);
      const field = (primary * 0.62 + cross * 0.26 + ripple * 0.12 + 1) * 0.5;

      dotWave.opacity = 0.28 + smoothStep(field) * 0.54;
      dotWave.offsetX = primary * 0.95 + cross * 0.48 + ripple * 0.18;
      dotWave.offsetY = -primary * 0.3 + cross * 0.68 - ripple * 0.24;
      return dotWave;
    };

    const getFieldValue = (x: number, y: number, nx: number, ny: number) => {
      const drift = reduceMotion ? 0 : time;
      const bank = Math.sin(ny * 5.8 + nx * 3.4 + Math.sin(nx * 3.8 - drift * 0.42) - drift * 0.82);
      const lobes = Math.cos(nx * 5.6 - ny * 3.1 + drift * 0.57);
      const grain =
        Math.sin(x * 0.039 + y * 0.031 + drift * 0.6) *
        Math.cos(x * 0.012 - y * 0.021 + drift * 0.37);
      return bank * 0.56 + lobes * 0.27 + grain * 0.17;
    };

    const getStormFront = (nx: number, ny: number, flow: number, crossFlow: number) => {
      if (reduceMotion) return 0;

      const primary = (Math.sin(nx * 3.1 + ny * 1.6 - flow) + 1) * 0.5;
      const cross = (Math.sin(nx * -1.8 + ny * 4.8 + crossFlow + Math.sin(flow) * 0.58) + 1) * 0.5;
      const filaments = (Math.sin(nx * 7.2 - ny * 2.4 + flow * 0.6 - crossFlow * 0.22) + 1) * 0.5;
      return smoothStep(primary * 0.54 + cross * 0.31 + filaments * 0.15);
    };

    const drawGranularDots = (
      parallaxX: number,
      parallaxY: number,
      stormNodes: ActiveStormNode[],
      intensity: number,
      spread: number,
    ) => {
      const stepX = width < 760 ? 25 : 20;
      const stepY = width < 760 ? 24 : 20;
      const elapsedSeconds = stormElapsed / 1000;
      context.fillStyle = palette.grain;

      for (let row = 0, y = 12; y < height; row += 1, y += stepY) {
        for (let column = 0, x = 10; x < width; column += 1, x += stepX) {
          const seed = cellNoise(column, row, 1);
          if (seed > 0.25) continue;

          const driftDepth = 0.22 + cellNoise(column, row, 2) * 0.42;
          const parallaxDepth = 0.55 + cellNoise(column, row, 5) * 0.55;
          const phase = elapsedSeconds * (0.15 + cellNoise(column, row, 3) * 0.1) + seed * 15;
          const fadePhase = elapsedSeconds * (0.33 + cellNoise(column, row, 6) * 0.16) + seed * 47;
          const pulse = reduceMotion ? 0.58 : 0.48 + Math.sin(phase) * 0.16;
          const localFade = reduceMotion ? 0.92 : 0.84 + smoothStep((Math.sin(fadePhase) + 1) * 0.5) * 0.16;
          const driftX = reduceMotion ? 0 : Math.sin(elapsedSeconds * 0.19 + seed * 27) * (0.28 + seed * 0.52);
          const driftY = reduceMotion ? 0 : Math.cos(elapsedSeconds * 0.15 + seed * 19) * (0.22 + seed * 0.42);
          const edgeDistance = Math.min(x, y, width - x, height - y);
          const glyph = dotChars[cellNoise(column, row, 4) > 0.82 ? 1 : 0];
          const offsetX = Math.round(-parallaxX * parallaxDepth * 4.2 + driftX * (0.76 + driftDepth));
          const offsetY = Math.round(-parallaxY * parallaxDepth * 3.1 + driftY * (0.76 + driftDepth));
          const renderedX = x + offsetX;
          const renderedY = y + offsetY;
          const wave = sampleDotWave(renderedX, renderedY, elapsedSeconds);
          const maskedX = renderedX + wave.offsetX;
          const maskedY = renderedY + wave.offsetY;
          let stormBoost = 0;

          for (const stormNode of stormNodes) {
            const distanceSquared = (maskedX - stormNode.x) ** 2 + (maskedY - stormNode.y) ** 2;

            if (distanceSquared < stormNode.radiusSquared) {
              const falloff = 1 - distanceSquared / stormNode.radiusSquared;
              stormBoost = Math.max(stormBoost, falloff * falloff * stormNode.envelope);
            }
          }

          const alpha =
            (0.12 + pulse * 0.14) *
            smoothStep(edgeDistance / 74) *
            contentMask(maskedX, maskedY) *
            wave.opacity *
            localFade *
            (1 + stormBoost * 0.55) * intensity;
          if (alpha < 0.04) continue;

          context.globalAlpha = Math.min(0.32, alpha) * (0.25 + 0.75 * spread);
          context.font = glyph === ":" ? "12px ui-monospace,monospace" : "11px ui-monospace,monospace";
          context.fillText(glyph,
            spread < 1 ? width / 2 + (maskedX - width / 2) * spread : maskedX,
            spread < 1 ? height / 2 + (maskedY - height / 2) * spread : maskedY);
        }
      }
    };

    const findCloudCenter = () => {
      let centerX = width * 0.5;
      let centerY = height * 0.5;
      let bestScore = -Infinity;

      for (let sample = 0; sample < 28; sample += 1) {
        const x = width * (0.16 + Math.random() * 0.68);
        const y = height * (0.16 + Math.random() * 0.68);
        const nx = (x / width - 0.5) * 2;
        const ny = (y / height - 0.5) * 2;
        const radius = Math.hypot(nx, ny);
        if (radius >= 1.45) continue;

        const score = getFieldValue(x, y, nx, ny) + contentMask(x, y) * 0.26 - Math.max(0, radius - 0.8) * 0.18;
        if (score > bestScore) {
          bestScore = score;
          centerX = x;
          centerY = y;
        }
      }

      return { x: centerX / width, y: centerY / height };
    };

    const createStormFlash = (): StormFlash => {
      const center = findCloudCenter();
      const direction = Math.random() * Math.PI * 2;
      const curve = (Math.random() - 0.5) * 0.9;
      const placeNode = (distance: number, turn: number) => ({
        x: clamp(center.x + Math.cos(direction + turn) * distance, 0.1, 0.9),
        y: clamp(center.y + Math.sin(direction + turn) * distance * 0.78, 0.12, 0.88),
      });
      const firstDuration = 760 + Math.random() * 160;
      const secondDelay = 460 + Math.random() * 160;
      const secondDuration = 700 + Math.random() * 160;
      const thirdDelay = secondDelay + 420 + Math.random() * 180;
      const thirdDuration = 640 + Math.random() * 160;
      const second = placeNode(0.15 + Math.random() * 0.05, curve);
      const third = placeNode(0.29 + Math.random() * 0.07, curve * 1.75);
      const nodes: StormNode[] = [
        { ...center, delay: 0, duration: firstDuration, strength: 1, radiusScale: 1 },
        { ...second, delay: secondDelay, duration: secondDuration, strength: 0.68, radiusScale: 0.82 },
        { ...third, delay: thirdDelay, duration: thirdDuration, strength: 0.46, radiusScale: 0.66 },
      ];

      return {
        startedAt: stormElapsed,
        duration: thirdDelay + thirdDuration,
        nodes,
      };
    };

    const clearWake = () => {
      wake.length = 0;
      lastWakePoint = null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (introStarted !== null || reduceMotion) return;
      if (typeof document.startViewTransition === "function" && event.target instanceof Element &&
          event.target.closest('.theme-switch button[aria-pressed="false"]')) return;

      const bounds = canvas.getBoundingClientRect();
      clickPulses.push({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        startedAt: performance.now(),
      });
      if (clickPulses.length > 3) clickPulses.shift();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (introStarted !== null || !finePointer || event.pointerType === "touch") return;

      const nextX = (event.clientX / window.innerWidth - 0.5) * 2;
      const nextY = (event.clientY / window.innerHeight - 0.5) * 2;
      const rect = canvas.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now() };
      if (!reduceMotion) {
        if (lastWakePoint) {
          const distance = Math.hypot(point.x - lastWakePoint.x, point.y - lastWakePoint.y);
          const steps = Math.floor(distance / 16);
          const elapsed = Math.max(1, point.time - lastWakePoint.time);
          const speed = distance / elapsed * 1000;
          const energy = Math.min(1, 0.72 + speed / 2200);

          for (let step = 1; step <= steps; step += 1) {
            const progress = step / (steps + 1);
            wake.push({
              x: lastWakePoint.x + (point.x - lastWakePoint.x) * progress,
              y: lastWakePoint.y + (point.y - lastWakePoint.y) * progress,
              time: lastWakePoint.time + elapsed * progress,
              energy,
            });
          }
        }

        wake.push({ ...point, energy: 0.72 });
        if (wake.length > 42) wake.splice(0, wake.length - 42);
        lastWakePoint = point;
      }

      if (reduceMotion) {
        pointerTargetX.jump(nextX);
        pointerTargetY.jump(nextY);
        pointerX.jump(nextX);
        pointerY.jump(nextY);
        draw();
        return;
      }

      pointerTargetX.set(nextX);
      pointerTargetY.set(nextY);
    };

    const resetParallax = () => {
      lastWakePoint = null;
      pointerTargetX.set(0);
      pointerTargetY.set(0);

      if (reduceMotion) {
        clearWake();
        pointerTargetX.jump(0);
        pointerTargetY.jump(0);
        pointerX.jump(0);
        pointerY.jump(0);
      }
    };

    const handleHoverPreference = (event: MediaQueryListEvent) => {
      finePointer = event.matches;
      if (!finePointer) {
        resetParallax();
      }
    };

    const draw = (timestamp = performance.now()) => {
      const delta = lastFrameTime ? Math.min(timestamp - lastFrameTime, 50) : 1000 / 60;
      lastFrameTime = timestamp;
      const ratio = window.devicePixelRatio || 1;
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.font = palette.cloudFont;
      context.textBaseline = "middle";

      const now = performance.now();
      let spread = 1;
      let introInk = 1;
      if (introStarted !== null) {
        const elapsed = now - introStarted;
        const progress = clamp((elapsed - introTiming.gather) / (introTiming.settle - introTiming.gather), 0, 1);
        const cluster = 0.15 - 0.075 * smoothStep(elapsed / introTiming.gather);
        spread = cluster + (1 - cluster) * smoothStep(progress);
        introInk = 0.38 + 0.62 * smoothStep(elapsed / 730);
        if (elapsed >= introTiming.ready) {
          finishIntro();
        } else {
          let nextStep = introStep;
          while (introLogs[nextStep + 1] && elapsed >= introLogs[nextStep + 1].at) nextStep += 1;
          if (nextStep !== introStep) {
            introStep = nextStep;
            onIntroStep(introStep);
          }
        }
      }
      fieldStrength += ((fieldHovered && !reduceMotion ? 1 : 0) - fieldStrength) * (1 - Math.exp(-delta / 105));
      const fieldIsAvatar = fieldElement?.classList.contains("avatar-preview-trigger");
      const fieldIsCard = fieldElement?.classList.contains("spotlight-card");
      const avatarGlitch = fieldIsAvatar ? 1 - smoothStep((now - fieldStarted) / 420) : 0;
      const field = fieldStrength > 0.015 && (!fieldIsAvatar || avatarGlitch > 0)
        ? fieldElement?.getBoundingClientRect() : undefined;
      const fieldCanvas = field || wave.current ? canvas.getBoundingClientRect() : null;
      const fieldLeft = (field?.left ?? 0) - (fieldCanvas?.left ?? 0);
      const fieldTop = (field?.top ?? 0) - (fieldCanvas?.top ?? 0);
      const fieldRight = fieldLeft + (field?.width ?? 0);
      const fieldBottom = fieldTop + (field?.height ?? 0);
      const fieldRange = fieldIsCard ? 61 : fieldIsAvatar ? 56 : 26;
      const activeWave = reduceMotion ? null : wave.current;
      const waveProgress = activeWave ? clamp((now - activeWave.startedAt) / themeRevealDuration, 0, 1) : 1;
      const waveRadius = waveProgress * (activeWave?.radius ?? 0);
      const waveX = (activeWave?.x ?? 0) - (fieldCanvas?.left ?? 0);
      const waveY = (activeWave?.y ?? 0) - (fieldCanvas?.top ?? 0);

      const intensity = compactQuery.matches ? 0.84 : 1;
      const parallaxX = reduceMotion || !finePointer ? 0 : pointerX.get();
      const parallaxY = reduceMotion || !finePointer ? 0 : pointerY.get();
      if (!reduceMotion) {
        stormElapsed += delta;

        if (!stormFlash && stormElapsed >= nextStormFlashAt && width > 0 && height > 0) {
          stormFlash = createStormFlash();
        }

        if (stormFlash && stormElapsed - stormFlash.startedAt >= stormFlash.duration) {
          stormFlash = null;
          nextStormFlashAt = stormElapsed + nextStormInterval();
        }
      }

      const shortEdge = Math.min(width, height);
      const flashRadius = shortEdge * 0.33;
      activeStormNodes.length = 0;
      if (stormFlash) {
        for (const node of stormFlash.nodes) {
          const rawProgress = (stormElapsed - stormFlash.startedAt - node.delay) / node.duration;
          if (rawProgress <= 0 || rawProgress >= 1) continue;

          const progress = clamp(rawProgress, 0, 1);
          const envelope = smoothStep(Math.sin(Math.PI * progress)) * node.strength;
          if (envelope <= 0) continue;

          const radius = flashRadius * node.radiusScale;
          activeStormNodes.push({
            x: node.x * width,
            y: node.y * height,
            radiusSquared: radius * radius,
            envelope,
          });
        }
      }
      const stormFlow = stormElapsed * (Math.PI * 2 / 7_600);
      const stormCrossFlow = stormElapsed * (Math.PI * 2 / 11_000);
      while (wake.length && now - wake[0].time > 1050) wake.shift();
      while (clickPulses.length && now - clickPulses[0].startedAt >= 900) clickPulses.shift();
      const activeClickPulses = clickPulses.map(({ x, y, startedAt }) => {
        const progress = (now - startedAt) / 900;
        const radius = 28 + shortEdge * 0.31 * (1 - (1 - progress) ** 2);
        const envelope = smoothStep(progress / 0.18) * (1 - smoothStep((progress - 0.18) / 0.82));
        return { x, y, radius, envelope, maxDistanceSquared: (radius * 1.18) ** 2 };
      });
      let wakeLeft = Infinity;
      let wakeRight = -Infinity;
      let wakeTop = Infinity;
      let wakeBottom = -Infinity;
      for (const sample of wake) {
        wakeLeft = Math.min(wakeLeft, sample.x);
        wakeRight = Math.max(wakeRight, sample.x);
        wakeTop = Math.min(wakeTop, sample.y);
        wakeBottom = Math.max(wakeBottom, sample.y);
      }
      wakeLeft -= 60;
      wakeRight += 60;
      wakeTop -= 60;
      wakeBottom += 60;

      if (width > 0 && height > 0) {
        context.fillStyle = palette.cloud;
        for (let y = 16; y < height; y += 14) {
          const ny = (y / height - 0.5) * 2;
          for (let x = 8; x < width; x += 10) {
            const nx = (x / width - 0.5) * 2;
            let influence = 0;
            let cardInk = 0;
            let fieldOffsetX = 0;
            let fieldOffsetY = 0;
            if (field && x > fieldLeft - fieldRange && x < fieldRight + fieldRange && y > fieldTop - fieldRange && y < fieldBottom + fieldRange) {
              const dx = x - clamp(x, fieldLeft, fieldRight);
              const dy = y - clamp(y, fieldTop, fieldBottom);
              const distance = Math.hypot(dx, dy);
              influence = smoothStep(1 - distance / fieldRange) * fieldStrength * (fieldIsCard ? 0.78 : fieldIsAvatar ? avatarGlitch : 0.28);
              // Seed the outside edge even when the ambient cloud has no glyph at this cell.
              if (fieldIsCard && distance > 0 && distance < 48) {
                const seed = cellNoise(x, y, 8);
                const edge = smoothStep(distance / 10) * smoothStep(1 - distance / 48);
                cardInk = fieldStrength * edge * smoothStep((seed - 0.18) / 0.62);
              }
              fieldOffsetX = (Math.sign(dx) * (fieldIsCard ? 7 : 4) + Math.sin(y * 0.35 + time * 25) * avatarGlitch * 9) * influence;
              fieldOffsetY = Math.sign(dy) * 5 * influence;
            }
            if (activeWave && waveProgress < 1) {
              const distance = Math.hypot(x - waveX, y - waveY);
              const ripple = smoothStep(1 - Math.abs(distance - waveRadius + 12) / 42) * (1 - waveProgress * 0.55);
              influence = Math.max(influence, ripple * 0.7);
              const radial = ripple * 7 / Math.max(1, distance);
              fieldOffsetX += (x - waveX) * radial;
              fieldOffsetY += (y - waveY) * radial;
            }
            const value = getFieldValue(x, y, nx, ny) + influence * 0.15;
            const stormFront = getStormFront(nx, ny, stormFlow, stormCrossFlow);
            let trail = 0;
            let flash = 0;
            let clickPulse = 0;

            for (const stormNode of activeStormNodes) {
              const dx = x - stormNode.x;
              const dy = y - stormNode.y;
              const distanceSquared = dx * dx + dy * dy;

              if (distanceSquared < stormNode.radiusSquared) {
                const falloff = 1 - distanceSquared / stormNode.radiusSquared;
                const cloudAffinity = smoothStep((value + 0.04) / 0.55);
                flash = Math.max(flash, smoothStep(falloff) * stormNode.envelope * cloudAffinity);
              }
            }

            for (const pulse of activeClickPulses) {
              const dx = x - pulse.x;
              const dy = y - pulse.y;
              const distanceSquared = dx * dx + dy * dy;
              if (distanceSquared >= pulse.maxDistanceSquared) continue;

              const angle = Math.atan2(dy, dx);
              const edge = 1 + Math.sin(angle * 5 + time * 2) * 0.11 + Math.cos(angle * 9 - time) * 0.07;
              const distance = Math.sqrt(distanceSquared) / (pulse.radius * edge);
              const core = smoothStep(1 - distance);
              const rim = smoothStep(1 - Math.abs(distance - 0.7) / 0.3) * 0.3;
              const spatial = Math.max(core, rim);
              clickPulse = Math.max(clickPulse, spatial * pulse.envelope);
            }

            if (
              !reduceMotion &&
              finePointer &&
              wake.length &&
              x >= wakeLeft && x <= wakeRight && y >= wakeTop && y <= wakeBottom
            ) {
              for (let index = wake.length - 1; index >= 0; index -= 1) {
                const sample = wake[index];
                const age = now - sample.time;
                if (age > 1050) continue;

                const dx = x - sample.x;
                const dy = y - sample.y;
                const trailRadius = 60;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared >= trailRadius * trailRadius) continue;

                const spatial = 1 - distanceSquared / (trailRadius * trailRadius);
                const temporal = Math.exp(-age / 430);
                trail = Math.max(trail, spatial * spatial * temporal * sample.energy);
                if (trail > 0.96) break;
              }
            }

            const threshold = 0.14 - stormFront * 0.065 - flash * 0.15 - trail * 0.25 - clickPulse * 0.22;

            if (value > threshold || trail > 0.08 || clickPulse > 0.08 || cardInk > 0.055) {
              const cloudDepth = clamp((value - threshold) / (1 - threshold), 0, 1);
              const cloud = smoothStep(cloudDepth) * 0.68 + cloudDepth * 0.32;
              const crest = cloud * stormFront;
              const density = clamp(0.12 + cloud * 0.72 + crest * 0.14 + trail * 0.76 + flash * 0.23 + clickPulse * 0.48 + cardInk * 0.5, 0, 1);
              const depth = 0.42 + (1 - Math.min(Math.hypot(nx, ny), 1)) * 0.72;
              const offsetX = Math.round(-parallaxX * depth * 4);
              const offsetY = Math.round(-parallaxY * depth * 3);
              const ambient = cloud * 0.47 + crest * 0.23;
              const response = Math.max(trail * 0.37, flash * 0.35, clickPulse * 0.62);
              const renderedX = x + offsetX + fieldOffsetX;
              const renderedY = y + offsetY + fieldOffsetY;

              const alpha = Math.min(0.68, (ambient + response + influence * 0.15 + cardInk * 0.31) * palette.cloudContrast) * contentMask(renderedX, renderedY) * intensity;
              if (alpha < 0.008) continue;

              context.globalAlpha = alpha * (0.25 + 0.75 * spread) * introInk;
              context.fillText(
                chars[Math.floor(density * (chars.length - 1))],
                spread < 1 ? width / 2 + (renderedX - width / 2) * spread + Math.sin(y * 0.075 + time * 8) * (1 - spread) * 11 : renderedX,
                spread < 1 ? height / 2 + (renderedY - height / 2) * spread : renderedY,
              );
            }
          }
        }

        drawGranularDots(parallaxX, parallaxY, activeStormNodes, intensity, spread);
      }

      context.globalAlpha = 1;
      if (!reduceMotion && !document.hidden) {
        time += delta * 0.00094;
        frame = window.requestAnimationFrame(draw);
      }
    };

    const handleVisibility = () => {
      window.cancelAnimationFrame(frame);
      lastFrameTime = 0;
      if (!document.hidden) {
        refreshContentMask();
        draw();
      }
    };
    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        if (introStarted !== null) finishIntro();
        fieldHovered = false;
        fieldStrength = 0;
        stormFlash = null;
        nextStormFlashAt = stormElapsed + nextStormInterval();
        clearWake();
        clickPulses.length = 0;
        resetParallax();
      }
      handleVisibility();
    };

    const resizeObserver = new ResizeObserver(() => {
      width = 0;
      height = 0;
      clearWake();
      clickPulses.length = 0;
      handleVisibility();
    });
    const updateContentMask = () => {
      refreshContentMask();
      if (reduceMotion && !document.hidden) draw();
    };
    const layoutObserver = new ResizeObserver(updateContentMask);
    const paletteObserver = new MutationObserver(() => {
      palette = readPalette();
      if (reduceMotion && !document.hidden) draw();
    });
    repaint.current = () => {
      palette = readPalette();
      window.cancelAnimationFrame(frame);
      draw();
    };

    resizeObserver.observe(canvas);
    paletteObserver.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    const layoutTargets = [".content-layout", ...maskTargets.map(({ selector }) => selector)].join(", ");
    document.querySelectorAll<HTMLElement>(layoutTargets).forEach((element) => layoutObserver.observe(element));
    refreshContentMask();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerover", syncField, { passive: true });
    const clearField = () => { fieldHovered = false; };
    window.addEventListener("pointerleave", clearField);
    window.addEventListener("blur", clearField);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerleave", resetParallax);
    window.addEventListener("scroll", updateContentMask, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("focusin", handleIntroFocus);
    document.addEventListener("keydown", handleIntroKey);
    motionQuery.addEventListener("change", handleMotionPreference);
    hoverQuery.addEventListener("change", handleHoverPreference);
    draw();

    return () => {
      repaint.current = null;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      layoutObserver.disconnect();
      paletteObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerover", syncField);
      window.removeEventListener("pointerleave", clearField);
      window.removeEventListener("blur", clearField);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerleave", resetParallax);
      window.removeEventListener("scroll", updateContentMask);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("focusin", handleIntroFocus);
      document.removeEventListener("keydown", handleIntroKey);
      motionQuery.removeEventListener("change", handleMotionPreference);
      hoverQuery.removeEventListener("change", handleHoverPreference);
    };
  }, [pointerTargetX, pointerTargetY, pointerX, pointerY, wave, repaint, onIntroStep]);

  return <canvas ref={canvasRef} className="ascii-field" aria-hidden="true" />;
}

function ProfilePhotoHoverPreview({ src, label }: { src: string; label: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [previewBounds, setPreviewBounds] = useState({ left: 0, top: 0, size: 0 });
  const reduceMotion = useReducedMotion();
  const spring = { stiffness: 300, damping: 28, mass: 0.3 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const rotate = useSpring(0, spring);

  useEffect(() => setIsMounted(true), []);

  const openPreview = (trigger: HTMLButtonElement) => {
    const bounds = trigger.getBoundingClientRect();
    const isCompact = window.matchMedia("(max-width: 770px)").matches;
    const margin = 17.6;
    const top = Math.max(margin, bounds.bottom + margin);
    const { clientWidth, clientHeight } = document.documentElement;
    const size = Math.min(165, clientWidth - margin * 2, clientHeight - top - margin);
    if (size <= 0) return;

    const left = isCompact
      ? (clientWidth - size) / 2
      : Math.max(margin, Math.min(bounds.left, clientWidth - size - margin));
    x.jump(0);
    y.jump(0);
    rotate.jump(0);
    setPreviewBounds({ left, top, size });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const closeOnTouchOutside = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || triggerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const closePreview = () => setIsOpen(false);

    window.addEventListener("pointerdown", closeOnTouchOutside);
    window.addEventListener("scroll", closePreview, { passive: true });
    window.addEventListener("resize", closePreview);
    return () => {
      window.removeEventListener("pointerdown", closeOnTouchOutside);
      window.removeEventListener("scroll", closePreview);
      window.removeEventListener("resize", closePreview);
    };
  }, [isOpen]);

  const preview = isMounted ? createPortal(
    <motion.div
      id="profile-photo-preview"
      className="profile-photo-preview"
      data-open={isOpen}
      style={{
        left: previewBounds.left, top: previewBounds.top,
        width: previewBounds.size, height: previewBounds.size,
        x: reduceMotion ? 0 : x, y: reduceMotion ? 0 : y, rotate: reduceMotion ? 0 : rotate,
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      transition={reduceMotion ? { duration: 0 } : {
        opacity: { duration: 0.16, ease: "easeOut" },
        scale: { type: "spring", stiffness: 360, damping: 28 },
      }}
      aria-hidden="true"
    >
      <img src={src} alt="" width="1317" height="1317" draggable={false} />
    </motion.div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="avatar-preview-trigger"
        style={{ "--avatar-image": `url(${src})` } as CSSProperties}
        aria-label={label}
        aria-controls="profile-photo-preview"
        aria-expanded={isOpen}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          event.currentTarget.dataset.portraitHover = "true";
          openPreview(event.currentTarget);
        }}
        onPointerMove={(event) => {
          if (!isOpen || reduceMotion || event.pointerType === "touch") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const horizontal = (event.clientX - bounds.left) / bounds.width * 2 - 1;
          const vertical = (event.clientY - bounds.top) / bounds.height * 2 - 1;
          x.set(horizontal * 8.8);
          y.set(vertical * 4.4);
          rotate.set(horizontal * 3);
        }}
        onPointerLeave={(event) => {
          delete event.currentTarget.dataset.portraitHover;
          x.set(0);
          y.set(0);
          rotate.set(0);
          if (event.pointerType !== "touch" && !event.currentTarget.matches(":focus-visible")) {
            setIsOpen(false);
          }
        }}
        onFocus={(event) => {
          if (!event.currentTarget.matches(":focus-visible")) return;
          openPreview(event.currentTarget);
        }}
        onBlur={() => setIsOpen(false)}
        onClick={(event) => {
          if (!window.matchMedia("(hover: none)").matches) return;
          if (event.detail === 0 || !isOpen) openPreview(event.currentTarget);
          else setIsOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            openPreview(event.currentTarget);
          }
        }}
      >
        <IntroOutline />
        <img className="avatar" src={src} alt="" width="1317" height="1317" />
      </button>
      {preview}
    </>
  );
}

export default function PortfolioClient() {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme | null>(null);
  const manualTheme = useRef<Theme | null>(null);
  const themeTransition = useRef<ViewTransition | null>(null);
  const wave = useRef<ThemeWave | null>(null);
  const repaint = useRef<(() => void) | null>(null);
  const [introStep, setIntroStep] = useState(-1);
  const [localeMotionReady, setLocaleMotionReady] = useState(false);
  const [localeTransitionId, setLocaleTransitionId] = useState(0);
  const reduceMotion = useReducedMotion();
  const [stars, setStars] = useState<Record<ProjectName, number>>({
    CashPad: 1,
    Transcrypty: 3,
    "SUB-SEEMG": 0,
  });
  const [commits, setCommits] = useState<Record<ProjectName, number>>({
    CashPad: 28,
    Transcrypty: 14,
    "SUB-SEEMG": 27,
  });
  const [track, setTrack] = useState<Track | null>(null);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(profileDisplayName);
  const [isProfileNameTransitioning, setIsProfileNameTransitioning] = useState(false);
  const currentCopy = copy[language];

  useEffect(() => {
    const system = window.matchMedia(lightThemeQuery);
    try {
      const saved = window.localStorage.getItem(themeStorageKey);
      if (isTheme(saved)) manualTheme.current = saved;
    } catch {
      // Follow the system until the visitor makes a choice for this page.
    }

    const syncTheme = () => {
      const next = manualTheme.current ?? (system.matches ? "light" : "dark");
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    syncTheme();
    system.addEventListener("change", syncTheme);
    return () => system.removeEventListener("change", syncTheme);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(languageKey);
      if (saved === "en" || saved === "pt") setLanguage(saved);
      window.localStorage.removeItem(`${starsKeyPrefix}DevlStreak`);
      setTrack(readCachedTrack());
    } catch {
      // The page keeps its English default when browser storage is unavailable.
    }
    const frame = window.requestAnimationFrame(() => setLocaleMotionReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "pt-BR";
    document.title = pageTitle;
  }, [language]);

  useEffect(() => {
    if (reduceMotion) return;

    let timeout: number | null = null;
    let cancelled = false;

    const scheduleAliasGlitch = () => {
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        setProfileName(profileAlias);
        setIsProfileNameTransitioning(true);

        timeout = window.setTimeout(() => {
          if (cancelled) return;
          setProfileName(profileDisplayName);

          timeout = window.setTimeout(() => {
            if (cancelled) return;
            setIsProfileNameTransitioning(false);
            scheduleAliasGlitch();
          }, 700);
        }, 4_000);
      }, 10_000 + Math.random() * 10_000);
    };

    scheduleAliasGlitch();
    return () => {
      cancelled = true;
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [reduceMotion]);

  useEffect(() => {
    const controller = new AbortController();

    for (const project of projects) {
      const storageKey = `${starsKeyPrefix}${project.name}`;
      const commitStorageKey = `${commitsKeyPrefix}${project.name}`;
      try {
        const cached = window.localStorage.getItem(storageKey);
        if (cached !== null && Number.isInteger(Number(cached))) {
          setStars((current) => ({ ...current, [project.name]: Number(cached) }));
        }
      } catch {
        // Live requests and fallback counts continue without local storage.
      }

      try {
        const cached = window.localStorage.getItem(commitStorageKey);
        const count = Number(cached);
        if (cached !== null && Number.isSafeInteger(count) && count >= 0) {
          setCommits((current) => ({ ...current, [project.name]: count }));
        }
      } catch {
        // Live requests and fallback counts continue without local storage.
      }

      fetch(`https://api.github.com/repos/renato0x/${encodeURIComponent(project.name)}`, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("GitHub API unavailable");
          return response.json() as Promise<{ stargazers_count?: number }>;
        })
        .then((data) => {
          if (!Number.isInteger(data.stargazers_count) || (data.stargazers_count ?? -1) < 0) return;
          const count = data.stargazers_count as number;
          setStars((current) => ({ ...current, [project.name]: count }));
          try {
            window.localStorage.setItem(storageKey, String(count));
          } catch {
            // The live count remains visible for this session.
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });

      getAuthorCommitCount(project.name, controller.signal)
        .then((count) => {
          if (!Number.isSafeInteger(count) || count < 0) return;
          setCommits((current) => ({ ...current, [project.name]: count }));
          try {
            window.localStorage.setItem(commitStorageKey, String(count));
          } catch {
            // The live count remains visible for this session.
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    let timeout: number | null = null;
    const controller = new AbortController();

    const refreshTrack = async () => {
      try {
        const response = await fetch("/api/spotify/now-playing", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!active) return;
        if (response.status === 204 || !response.ok) {
          setTrack((current) => current ? { ...current, source: "cached" } : null);
          return;
        }

        const value: unknown = await response.json();
        if (
          !isRecord(value) ||
          typeof value.title !== "string" ||
          typeof value.artist !== "string" ||
          typeof value.cover !== "string" ||
          !value.cover.startsWith("https:") ||
          (value.source !== "spotify" && value.source !== "discord" && value.source !== "recent" && value.source !== "stored")
        ) {
          setTrack((current) => current ? { ...current, source: "cached" } : null);
          return;
        }

        const nextTrack: Track = {
          title: value.title,
          artist: value.artist,
          cover: value.cover,
          source: value.source,
        };
        setTrack(nextTrack);
        try {
          window.localStorage.setItem(lastTrackKey, JSON.stringify({
            title: nextTrack.title,
            artist: nextTrack.artist,
            cover: nextTrack.cover,
          }));
        } catch {
          // The live or recently played result remains visible for this session.
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setTrack((current) => current ? { ...current, source: "cached" } : null);
      } finally {
        if (active) timeout = window.setTimeout(refreshTrack, 15_000);
      }
    };

    void refreshTrack();
    return () => {
      active = false;
      controller.abort();
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    if (nextLanguage === language) return;
    setLocaleTransitionId((current) => current + 1);
    setLanguage(nextLanguage);
    try {
      window.localStorage.setItem(languageKey, nextLanguage);
    } catch {
      // Language still changes for the current page view.
    }
  };

  const changeTheme = (next: Theme, trigger: HTMLButtonElement) => {
    const root = document.documentElement;
    const current = manualTheme.current ?? root.dataset.theme;
    manualTheme.current = next;
    try {
      window.localStorage.setItem(themeStorageKey, next);
    } catch {
      // The current page can still use the selected theme.
    }
    if (current === next) return;

    const apply = () => {
      root.dataset.theme = next;
      setTheme(next);
    };
    if (reduceMotion || document.hidden || !document.startViewTransition || themeTransition.current) {
      themeTransition.current?.skipTransition();
      wave.current = null;
      apply();
      return;
    }

    const bounds = trigger.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-radius", `${radius}px`);
    root.style.setProperty("--theme-duration", `${themeRevealDuration}ms`);
    root.dataset.themeWave = "active";

    const transition = document.startViewTransition(() => {
      if (manualTheme.current !== next) return;
      flushSync(apply);
      repaint.current?.();
    });
    themeTransition.current = transition;
    void transition.ready.then(() => {
      if (manualTheme.current === next) wave.current = { x, y, radius, startedAt: performance.now() };
    }, () => {});
    const finish = () => {
      themeTransition.current = null;
      wave.current = null;
      delete root.dataset.themeWave;
    };
    void transition.finished.then(finish, finish);
  };

  const handleCoverError = () => {
    if (track) setFailedCover(track.cover);
  };

  const projectsLabel = currentCopy.projects;
  const aboutLabel = currentCopy.about;
  const technologiesLabel = currentCopy.technologies;
  const profileLabel = currentCopy.profile;
  const socialLinksLabel = currentCopy.socialLinks;
  const isPlaying = track?.source === "spotify" || track?.source === "discord";
  const [bioLead, bioRest] = currentCopy.bio;
  const assembling = introStep >= 0;
  const currentIntroLog = introLogs[introStep];
  const visibleIntroLogs = assembling ? introLogs.slice(Math.max(0, introStep - 1), introStep + 1) : [];

  return (
    <>
      <AsciiField wave={wave} repaint={repaint} onIntroStep={setIntroStep} />
      <PortfolioCursor />
      <main className="page page-intro" aria-label={currentCopy.content} style={introStyle}>
        <header className="utility">
          {assembling && (
            <div className="launch-log" aria-hidden="true">
              {visibleIntroLogs.map((log) => (
                <span key={log.at} data-complete={log.ok}>
                  [{log.ok ? "OK" : "··"}] {log[language]}
                </span>
              ))}
            </div>
          )}
          <div className="preference-switch theme-switch" data-pending={theme === null || undefined} role="group" aria-label={language === "pt" ? "Tema" : "Theme"}>
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                data-theme-choice={option}
                aria-label={option === "light"
                  ? (language === "pt" ? "Tema claro" : "Light theme")
                  : (language === "pt" ? "Tema escuro" : "Dark theme")}
                aria-pressed={theme === option}
                onClick={(event) => changeTheme(option, event.currentTarget)}
              >
                {theme === option && (
                  <motion.span
                    layoutId="theme-indicator"
                    className="preference-indicator"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }}
                  />
                )}
                <svg className="preference-label" aria-hidden="true" width="16.5" height="16.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {option === "light" ? (
                    <>
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m0-14-1.5 1.5m-11 11L5 19" />
                    </>
                  ) : <path d="M20.5 14.4A8.7 8.7 0 0 1 9.6 3.5a8.7 8.7 0 1 0 10.9 10.9Z" />}
                </svg>
              </button>
            ))}
          </div>
          <div className="preference-switch language-switch" role="group" aria-label={language === "pt" ? "Idioma" : "Language"}>
            <button type="button" onClick={() => changeLanguage("pt")} aria-pressed={language === "pt"}>
              {language === "pt" && (localeMotionReady
                ? <motion.span layoutId="language-indicator" className="preference-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }} />
                : <span className="preference-indicator" />)}
              <span className="preference-label">PT</span>
            </button>
            <button type="button" onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>
              {language === "en" && (localeMotionReady
                ? <motion.span layoutId="language-indicator" className="preference-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }} />
                : <span className="preference-indicator" />)}
              <span className="preference-label">EN</span>
            </button>
          </div>
        </header>

        <div className="content-layout">
          <h1 className="sr-only">renato0x</h1>

          <aside className="profile-column" aria-label={profileLabel}>
            <span className="entry-ascii entry-ascii--profile" aria-hidden="true">.:=+*#@</span>
            <div className="profile-head">
              <ProfilePhotoHoverPreview
                src="/assets/profile.jpeg"
                label={language === "pt" ? "Prévia da foto de perfil de Renato Monteiro" : "Preview Renato Monteiro's profile photo"}
              />
              <div className="profile-details">
                <span className="profile-name-wrap">
                  {isProfileNameTransitioning
                    ? <EncryptedText
                        key={profileName}
                        text={profileName}
                        className="profile-name"
                        encryptedClassName="scrambled-text"
                        revealDelayMs={50}
                        flipDelayMs={50}
                        glitchIntervalMs={0}
                      />
                    : <span className="profile-name">Renato Monteiro</span>}
                  {currentIntroLog?.at === introTiming.name && (
                    <span className="intro-name-code" aria-hidden="true">
                      <EncryptedText text={profileDisplayName} className="profile-name" encryptedClassName="scrambled-text" revealMode="organic" revealDurationMs={420} glitchIntervalMs={0} charset=".:=+*#@" />
                    </span>
                  )}
                </span>
                <p className="profile-role">
                  <LocaleSwap ready={localeMotionReady} transitionId={localeTransitionId}>
                    {language === "pt" ? "Desenvolvedor de software · ADS, IFNMG" : "Software developer · Systems Analysis, IFNMG"}
                  </LocaleSwap>
                </p>
              </div>
            </div>

            <nav className="socials" aria-label={socialLinksLabel}>
              <HoverTooltip as="a" label="Instagram" href="https://www.instagram.com/renato0x/" target="_blank" rel="noreferrer">
                <img src="/assets/social/instagram.svg" alt="" width="17" height="17" />
              </HoverTooltip>
              <HoverTooltip as="a" label="GitHub" href="https://github.com/renato0x" target="_blank" rel="noreferrer">
                <img src="/assets/social/github.svg" alt="" width="17" height="17" />
              </HoverTooltip>
              <HoverTooltip as="a" label="Discord" href="https://discord.com/users/726487228187934723" target="_blank" rel="noreferrer">
                <img src="/assets/social/discord.svg" alt="" width="17" height="17" />
              </HoverTooltip>
              <HoverTooltip as="a" label="LinkedIn" href="https://www.linkedin.com/in/renato-mont/" target="_blank" rel="noreferrer">
                <span className="monogram" aria-hidden="true">in</span>
              </HoverTooltip>
            </nav>
          </aside>

          <section className="bio-block" aria-label={aboutLabel}>
            <span className="entry-ascii" aria-hidden="true">.:=+*#@</span>
            <p>
              <LocaleSwap
                block
                ready={localeMotionReady}
                transitionId={localeTransitionId}
                highlightTerms={currentCopy.bioHighlights}
              >
                {bioLead}
              </LocaleSwap>
            </p>
          </section>

          <section className="projects" aria-labelledby="projects-title">
            <span className="entry-ascii entry-ascii--projects" aria-hidden="true">.:=+*#@</span>
            <h2 className="sr-only" id="projects-title">{projectsLabel}</h2>
            <div className="project-grid">
              {projects.map((project, index) => (
                <SpotlightCard
                  as="a"
                  className="project-card"
                  style={{ "--n": index + 1 } as CSSProperties}
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.name}. ${project.description[language]}. ${commits[project.name] ?? project.fallbackCommits} ${currentCopy.githubCommits}. ${currentCopy.openProject(project.name)}`}
                  key={project.name}
                >
                  <IntroOutline />
                  <div className="project-top">
                    <img className="project-mark" src={project.logo} alt="" />
                    <span className="project-open" aria-hidden="true">↗</span>
                  </div>
                  <div className="project-copy">
                    <h3>{project.name}</h3>
                    <p><LocaleSwap block ready={localeMotionReady} transitionId={localeTransitionId}>{project.description[language]}</LocaleSwap></p>
                  </div>
                  <div className="project-meta">
                    <span className="language">
                      <i className="language-dot" />
                      {project.meta[language]}
                    </span>
                    <span className="stars" aria-label={currentCopy.githubStars}>
                      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                      </svg>
                      <b aria-live="polite">{stars[project.name] ?? project.fallbackStars}</b>
                    </span>
                    <span
                      className="commit-count"
                      role="img"
                      title={currentCopy.githubCommits}
                      aria-label={`${commits[project.name] ?? project.fallbackCommits} ${currentCopy.githubCommits}`}
                    >
                      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                        <path d="M3 12h6m6 0h6" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <b aria-live="polite">{commits[project.name] ?? project.fallbackCommits}</b>
                    </span>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </section>

          <section className="bio-block bio-rest">
            <p>
              <LocaleSwap block ready={localeMotionReady} transitionId={localeTransitionId}>
                {bioRest}
              </LocaleSwap>
            </p>
          </section>

          <section className="stacks" aria-label={technologiesLabel}>
            <span className="entry-ascii entry-ascii--stacks" aria-hidden="true">.:=+*#@</span>
            <ul className="stack-row" role="list" aria-label={currentCopy.technologyList}>
              {stackItems.map(([name, image], index) => (
                <HoverTooltip as="li" className="stack-item" label={name} key={name} style={{ "--stack-index": index } as CSSProperties}>
                  <img src={image} alt="" width="18" height="18" />
                </HoverTooltip>
              ))}
            </ul>
          </section>

          <SpotlightCard as="section" className="music-card" aria-label={currentCopy.spotify} data-source={track?.source ?? "empty"} data-playing={isPlaying}>
            <IntroOutline />
            <span className="music-wave" aria-hidden="true">
              <i /><i /><i /><i /><i /><i /><i /><i /><i />
            </span>
            <div className="music-art">
              {track && failedCover !== track.cover
                ? <img className="music-cover" src={track.cover} alt="" width="54" height="54" onError={handleCoverError} />
                : <div className="music-art-empty" aria-hidden="true" />}
            </div>
            <div className="music-info" aria-live="polite">
              <div className="music-heading">
                <span className="music-brand">
                  <img className="spotify-mark" src="/assets/social/spotify.svg" alt="" width="13" height="13" />
                  <span>Spotify</span>
                </span>
                <LocaleSwap className="music-state" ready={localeMotionReady} transitionId={localeTransitionId}>
                  {track?.source === "spotify"
                    ? currentCopy.listening
                    : track?.source === "discord"
                      ? currentCopy.viaDiscord
                      : track
                        ? currentCopy.lastPlayed
                        : currentCopy.noPlayback}
                </LocaleSwap>
              </div>
              <h2 className="music-title">
                {track
                  ? <EncryptedText text={track.title} encryptedClassName="scrambled-text" revealDelayMs={32} flipDelayMs={28} glitchIntervalMs={0} />
                  : currentCopy.noRecentTrack}
              </h2>
              <p className="music-artist">
                {track
                  ? <EncryptedText text={track.artist} encryptedClassName="scrambled-text" revealDelayMs={32} flipDelayMs={28} glitchIntervalMs={0} />
                  : currentCopy.noRecentArtist}
              </p>
            </div>
          </SpotlightCard>
        </div>
        <footer className="portfolio-status" aria-label={language === "pt" ? "Status do portfólio" : "Portfolio status"}>
          <div className="portfolio-status-meta">
            <span className="portfolio-status-state" role="status">
              <span aria-hidden="true">●</span>{" "}
              {assembling ? (language === "pt" ? "iniciando" : "starting") : (language === "pt" ? "sistema pronto" : "system ready")}
            </span>
            <span>v{portfolioVersion}</span>
            <span>UTF-8</span>
          </div>
          <a href="https://github.com/renato0x/renato0x-website" target="_blank" rel="noopener noreferrer">
            <span className="status-chevron" aria-hidden="true">&gt;</span>{" "}
            {language === "pt" ? "ver repositório" : "view repository"}{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </main>
    </>
  );
}
