"use client";

import { useEffect, useRef, useState } from "react";

function pulseRandom(trackKey: string) {
  let seed = 2166136261;
  for (const character of trackKey) {
    seed = Math.imul(seed ^ character.codePointAt(0)!, 16777619);
  }

  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pulseSequence(random: () => number, leadIn: number) {
  const attack = "cubic-bezier(.22,.65,.35,1)";
  const frames: (Keyframe & { offset: number })[] = [{ offset: 0, scale: "1", easing: attack }];
  const between = (minimum: number, maximum: number) => minimum + (maximum - minimum) * random();
  let time = leadIn;

  const hit = (at: number, strength: number, release: number) => {
    if (at > 0) frames.push({ offset: at, scale: "1", easing: attack });
    const peak = at + between(45, 65);
    frames.push(
      { offset: peak, scale: (1 + strength).toFixed(4), easing: "cubic-bezier(.2,.65,.3,1)" },
      { offset: peak + release, scale: "1" },
    );
  };

  for (let index = 0; index < 10; index += 1) {
    const strength = between(.004, .008);
    const double = random() < .2;
    hit(time, strength, double ? between(140, 170) : between(175, 255));
    if (double) hit(time + between(240, 320), strength * between(.45, .65), between(115, 180));
    time += random() < .15 ? between(2000, 3000) : between(700, 1700);
  }

  for (const frame of frames) frame.offset /= time;
  frames.push({ offset: 1, scale: "1" });
  return { frames, duration: time };
}

export function MusicPulse({ trackKey, playing, language }: {
  trackKey: string | null;
  playing: boolean;
  language: "pt" | "en";
}) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const sequence = useRef<{ key: string; random: () => number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof HTMLElement.prototype.animate === "function" && CSS.supports("scale", "1"));
  }, []);

  useEffect(() => {
    if (trackKey !== sequence.current?.key) {
      sequence.current = trackKey ? { key: trackKey, random: pulseRandom(trackKey) } : null;
    }
    const random = sequence.current?.random;
    const card = indicatorRef.current?.closest(".music-card");
    if (!random || !playing || paused || !supported || !card) return;

    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;
    let animation: Animation | null = null;

    const eligible = () => !disposed && visible && !document.hidden && !reduced.matches &&
      !root.hasAttribute("data-theme-wave") &&
      root.dataset.asciiIntro !== "pending" && root.dataset.asciiIntro !== "building";

    const play = (leadIn: number) => {
      const { frames, duration } = pulseSequence(random, leadIn);
      const current = card.animate(frames, { duration });
      animation = current;
      current.onfinish = () => {
        if (animation !== current) return;
        animation = null;
        if (eligible()) play(0);
      };
    };

    const stop = () => {
      if (!animation) return;
      animation.onfinish = null;
      animation.cancel();
      animation = null;
    };
    const sync = () => {
      if (!eligible()) stop();
      else if (!animation) play(450);
    };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .1;
      sync();
    }, { threshold: .1 });
    const transition = new MutationObserver(sync);
    visibility.observe(card);
    transition.observe(root, { attributes: true, attributeFilter: ["data-theme-wave", "data-ascii-intro"] });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);

    return () => {
      disposed = true;
      stop();
      transition.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [trackKey, playing, paused, supported]);

  const label = language === "pt" ? "Pulso do card do Spotify" : "Spotify card pulse";
  const action = language === "pt"
    ? (paused ? "Retomar animação" : "Pausar animação")
    : (paused ? "Resume animation" : "Pause animation");

  return (
    <div className="music-wave" ref={indicatorRef}>
      {playing && supported && (
        <button
          type="button"
          className="music-pulse-toggle"
          aria-label={label}
          aria-pressed={!paused}
          title={action}
          onClick={() => setPaused((value) => !value)}
        >
          <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M4 2.5 9 6 4 9.5Z" /> : <path d="M3.5 2.5h1.5v7H3.5zm3.5 0h1.5v7H7z" />}
          </svg>
        </button>
      )}
      <span className="music-wave-bars" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i /><i />
      </span>
    </div>
  );
}
