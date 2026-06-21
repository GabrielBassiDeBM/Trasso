"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

/** Types a natural-language prompt, then reveals the question card AI would generate from it. */
export function AiPromptTyping({
  prompt,
  resultLabel,
  resultChip,
}: {
  prompt: string;
  resultLabel: string;
  resultChip: string;
}) {
  const [typed, setTyped] = useState("");
  const [showResult, setShowResult] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const id = setTimeout(() => {
        setTyped(prompt);
        setShowResult(true);
      }, 0);
      return () => clearTimeout(id);
    }

    const el = ref.current;
    if (!el) return;

    let timers: ReturnType<typeof setTimeout>[] = [];
    const runCycle = () => {
      setShowResult(false);
      setTyped("");
      prompt.split("").forEach((_, i) => {
        timers.push(setTimeout(() => setTyped(prompt.slice(0, i + 1)), 28 * i));
      });
      timers.push(setTimeout(() => setShowResult(true), 28 * prompt.length + 350));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runCycle();
          const interval = setInterval(runCycle, 28 * prompt.length + 3600);
          timers.push(interval as unknown as ReturnType<typeof setTimeout>);
        } else {
          timers.forEach(clearTimeout);
          timers = [];
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [prompt]);

  return (
    <div ref={ref} className="rounded-xl border border-line bg-canvas p-4">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
        <Sparkles className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
        <p className="min-h-[1.25rem] flex-1 text-sm text-ink">
          {typed}
          <span aria-hidden="true" className="animate-pulse text-brand">
            ▍
          </span>
        </p>
      </div>

      <div
        className="mt-3 flex items-center gap-2 transition-opacity duration-300"
        style={{ opacity: showResult ? 1 : 0 }}
      >
        <span className="text-xs font-semibold text-ink-faint">{resultLabel}</span>
        <span className="rounded-full border border-brand/40 bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark">
          {resultChip}
        </span>
      </div>
    </div>
  );
}
