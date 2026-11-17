"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { isTheme, themes } from "@/lib/theme";
import type { Theme } from "@/lib/theme";

type Language = "pt" | "en";
type Track = { title: string; artist: string; source: string };
type Project = { name: string; href: string; aliases: readonly string[] };
type TerminalProps = {
  language: Language;
  theme: Theme | null;
  about: readonly string[];
  projects: readonly Project[];
  github: string;
  repository: string;
  track: Track | null;
  onTheme: (theme: Theme) => void;
  onLanguage: (language: Language) => void;
  onMotion: (bounds: DOMRect, opening: boolean) => void;
};
type Entry = { id: number; command: string; output: string };

const commands = ["help", "about", "projects", "open", "github", "repo", "theme", "lang", "spotify", "clear", "exit"];
const quickCommands = ["help", "projects", "theme", "spotify"];
const normalizeProject = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const collapsed = "inset(0 calc(100% - 80px) calc(100% - 40px) 0 round 8px)";
const expanded = "inset(0 0 0 0 round 8px)";
export const terminalDuration = 520;

export function PortfolioTerminal(props: TerminalProps) {
  const { language, theme, projects, track, onMotion } = props;
  const pt = language === "pt";
  const id = useId();
  const [reduced, setReduced] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const counter = useRef(0);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(0);
  const draft = useRef("");
  const previousFocus = useRef<HTMLElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  const focusInput = () => field.current?.focus({ preventScroll: true });
  const toggle = useCallback((next: boolean, focusImmediately = false) => {
    if (next === open) return;
    if (next) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      flushSync(() => setOpen(true));
      if (panel.current) {
        panel.current.inert = false;
        onMotion(panel.current.getBoundingClientRect(), true);
      }
      if (focusImmediately || reduced) field.current?.focus({ preventScroll: true });
      return;
    }

    if (panel.current) {
      panel.current.inert = true;
      onMotion(panel.current.getBoundingClientRect(), false);
    }
    setOpen(false);
    const returnTo = previousFocus.current;
    if (returnTo?.isConnected && returnTo !== document.body) returnTo.focus({ preventScroll: true });
    else trigger.current?.focus({ preventScroll: true });
  }, [open, reduced, onMotion]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      const target = event.target;
      if (target instanceof Element && target !== field.current &&
          target.closest("input,textarea,select,[contenteditable]:not([contenteditable=false])")) return;
      if (event.key === "Escape" && open) {
        event.preventDefault();
        toggle(false);
      } else if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle(!open);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [open, toggle]);

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const fit = () => panel.current?.style.setProperty("--terminal-visible-height", `${viewport.height}px`);
    fit();
    viewport.addEventListener("resize", fit);
    return () => viewport.removeEventListener("resize", fit);
  }, [open]);

  useEffect(() => {
    if (open && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [entries, open]);

  const typed = input.trimStart().toLowerCase().replace(/\s+/g, " ");
  const [verb, ...parts] = typed.trim().split(/\s+/);
  const argument = parts.join(" ");
  const candidates = verb === "open"
    ? projects.filter(({ name, aliases }) => [name, ...aliases].some((alias) => normalizeProject(alias).startsWith(normalizeProject(argument))))
        .map(({ name }) => `open ${name}`)
    : verb === "theme" ? themes.map((option) => `theme ${option}`)
    : verb === "lang" ? ["lang pt", "lang en"]
    : typed ? commands : quickCommands;
  const suggestions = candidates.filter((candidate) => candidate.toLowerCase().startsWith(typed) || verb === "open")
    .filter((candidate) => candidate.toLowerCase() !== typed).slice(0, 5);

  const submit = () => {
    const command = input.trim();
    if (!command) return;
    setInput("");
    draft.current = "";
    history.current = [...history.current.slice(-99), command];
    historyIndex.current = history.current.length;
    const reply = (output: string) => {
      const entry = { id: ++counter.current, command, output };
      setEntries((previous) => [...previous.slice(-99), entry]);
    };
    const openLink = (href: string) => {
      window.open(href, "_blank", "noopener,noreferrer");
      reply(href);
    };
    const usage = (example: string) => reply(`${pt ? "Use" : "Usage"} ${example}`);

    switch (verb) {
      case "help":
        reply(pt
          ? "about · apresentação\nprojects · listar projetos\nopen <projeto> · abrir projeto\ngithub · perfil\nrepo · repositório\ntheme [light|dark|spotify] · tema\nlang pt|en · idioma\nspotify · reprodução\nclear · limpar\nexit · fechar"
          : "about · introduction\nprojects · list projects\nopen <project> · open project\ngithub · profile\nrepo · repository\ntheme [light|dark|spotify] · theme\nlang pt|en · language\nspotify · playback\nclear · clear\nexit · close");
        break;
      case "about": reply(props.about.join("\n\n")); break;
      case "projects": reply(projects.map(({ name }) => `open ${name}`).join("\n")); break;
      case "open": {
        if (!argument) { usage(pt ? "open <projeto>" : "open <project>"); break; }
        const query = normalizeProject(argument);
        const project = query && projects.find(({ name, aliases }) =>
          [name, ...aliases].some((alias) => normalizeProject(alias) === query));
        if (project) openLink(project.href);
        else reply(pt ? "Projeto desconhecido. Digite projects." : "Unknown project. Type projects.");
        break;
      }
      case "github": openLink(props.github); break;
      case "repo": openLink(props.repository); break;
      case "theme":
        if (!argument) reply(`${pt ? "Tema atual" : "Current theme"} · ${theme ?? "dark"}\n${themes.join(" · ")}`);
        else if (isTheme(argument)) {
          props.onTheme(argument);
          reply(`${pt ? "Tema" : "Theme"} · ${argument}`);
        } else usage("theme light|dark|spotify");
        break;
      case "lang":
        if (argument === "pt" || argument === "en") {
          props.onLanguage(argument);
          reply(argument === "pt" ? "Idioma · Português" : "Language · English");
        } else usage("lang pt|en");
        break;
      case "spotify":
        if (!track) reply(pt ? "Sem faixa conhecida." : "No known track.");
        else {
          const status = track.source === "spotify" ? (pt ? "Tocando agora" : "Now playing")
            : track.source === "discord" ? (pt ? "Tocando via Discord" : "Playing via Discord")
            : (pt ? "Última faixa conhecida" : "Last known track");
          reply(`${status}\n${track.title} · ${track.artist}`);
        }
        break;
      case "clear": setEntries([]); history.current = []; historyIndex.current = 0; break;
      case "exit": reply(pt ? "Terminal fechado." : "Terminal closed."); toggle(false); break;
      default: reply(pt ? "Comando desconhecido. Digite help." : "Unknown command. Type help.");
    }
  };

  return (
    <div className="terminal-dock">
      <button
        ref={trigger}
        type="button"
        className="terminal-trigger"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-keyshortcuts="Control+K Meta+K"
        onClick={() => toggle(!open, matchMedia("(pointer: coarse)").matches)}
      >
        <span aria-hidden="true">&gt;</span> terminal
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            id={id}
            ref={panel}
            className="terminal-panel"
            role="dialog"
            aria-label="Terminal ASCII"
            initial={reduced ? false : { clipPath: collapsed }}
            animate={{ clipPath: expanded }}
            exit={{ clipPath: collapsed, opacity: 0 }}
            transition={{ duration: reduced ? 0 : terminalDuration / 1000, ease: [.22, .85, .24, 1] }}
            onAnimationComplete={() => {
              if (panel.current && !panel.current.inert &&
                  (document.activeElement === trigger.current || document.activeElement === previousFocus.current)) focusInput();
            }}
          >
            <svg className="terminal-trace" aria-hidden="true"><rect pathLength="1" /></svg>
            <span className="terminal-escape" aria-hidden="true">Esc</span>
            <div className="terminal-log" ref={log} role="log" tabIndex={entries.length ? 0 : undefined} aria-label={pt ? "Histórico do terminal" : "Terminal history"}>
              {entries.map(({ id: entryId, command, output }) => (
                <div className="terminal-entry" key={entryId}>
                  <div className="terminal-command"><span aria-hidden="true">&gt;</span> {command}</div>
                  <div>{output}</div>
                </div>
              ))}
            </div>
            {suggestions.length > 0 && (
              <div className="terminal-suggestions" aria-label={pt ? "Sugestões" : "Suggestions"}>
                {suggestions.map((candidate) => <button key={candidate} type="button" onClick={() => { setInput(candidate); focusInput(); }}>{candidate}</button>)}
              </div>
            )}
            <form className="terminal-input" onSubmit={(event) => { event.preventDefault(); submit(); }}>
              <span aria-hidden="true">&gt;</span>
              <input
                ref={field}
                aria-label={pt ? "Comando" : "Command"}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="go"
                placeholder={pt ? "Digite um comando" : "Type a command"}
                maxLength={180}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;
                  if ((event.key === "ArrowUp" || event.key === "ArrowDown") && history.current.length) {
                    event.preventDefault();
                    if (historyIndex.current === history.current.length) draft.current = input;
                    const direction = event.key === "ArrowUp" ? -1 : 1;
                    historyIndex.current = Math.max(0, Math.min(history.current.length, historyIndex.current + direction));
                    setInput(history.current[historyIndex.current] ?? draft.current);
                  } else if (event.key === "Tab" && !event.shiftKey && typed && suggestions[0]) {
                    event.preventDefault();
                    setInput(suggestions[0]);
                  }
                }}
              />
              <button type="submit">{pt ? "Executar" : "Run"}</button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
