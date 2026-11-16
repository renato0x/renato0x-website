"use client";

import { useEffect, useRef } from "react";

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

function pulseSequence(random: () => number, startScale: number) {
  const easing = "cubic-bezier(.42,0,.58,1)";
  const frames: (Keyframe & { offset: number })[] = [{ offset: 0, scale: String(startScale), easing }];
  const between = (minimum: number, maximum: number) => minimum + (maximum - minimum) * random();
  let time = 0;
  let scale = startScale;

  const moveTo = (nextScale: number, duration: number) => {
    time += duration;
    scale = nextScale;
    frames.push({ offset: time, scale: String(scale), easing });
  };

  for (let index = 0; index < 10; index += 1) {
    const strength = between(.014, .021);
    moveTo(1 + strength, between(320, 570));

    if (random() < .23) {
      moveTo(1 + between(.005, .008), between(210, 300));
      moveTo(1 + strength * between(.68, .84), between(240, 340));
    }

    const release = random() < .18 ? between(850, 1100) : between(380, 710);
    moveTo(1 + between(.0015, .004), release);
  }

  for (const frame of frames) frame.offset /= time;
  return { frames, duration: time, endScale: scale };
}

export function MusicPulse({ trackKey, playing }: {
  trackKey: string | null;
  playing: boolean;
}) {
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const sequence = useRef<{ key: string; random: () => number } | null>(null);

  useEffect(() => {
    if (trackKey !== sequence.current?.key) {
      sequence.current = trackKey ? { key: trackKey, random: pulseRandom(trackKey) } : null;
    }
    const random = sequence.current?.random;
    const indicator = indicatorRef.current;
    const card = indicator?.closest(".music-card");
    if (!random || !playing || !indicator || !card) return;

    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canPulse = typeof card.animate === "function" && CSS.supports("scale", "1");
    let visible = false;
    let disposed = false;
    let animation: Animation | null = null;

    const eligible = () => !disposed && visible && !document.hidden && !reduced.matches &&
      !root.hasAttribute("data-theme-wave") &&
      root.dataset.asciiIntro !== "pending" && root.dataset.asciiIntro !== "building";

    const play = (startScale: number) => {
      const { frames, duration, endScale } = pulseSequence(random, startScale);
      // Keep the shared scale visible while the next sequence starts.
      const current = card.animate(frames, { duration, fill: "both" });
      animation = current;
      current.onfinish = () => {
        if (animation !== current) return;
        animation = null;
        if (eligible()) play(endScale);
        current.cancel();
      };
    };

    const stop = () => {
      if (!animation) return;
      animation.onfinish = null;
      animation.cancel();
      animation = null;
    };
    const sync = () => {
      const active = eligible();
      indicator.toggleAttribute("data-live", active);
      if (!active) stop();
      else if (canPulse && !animation) play(1);
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
      indicator.removeAttribute("data-live");
      transition.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [trackKey, playing]);

  return (
    <span className="music-wave" ref={indicatorRef} aria-hidden="true">
      <i /><i /><i /><i /><i /><i /><i /><i /><i />
    </span>
  );
}
