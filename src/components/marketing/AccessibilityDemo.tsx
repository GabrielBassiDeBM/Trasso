"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type Mode = "standard" | "dyslexia" | "adhd" | "autism" | "lowVision";

const MODE_CLASSES: Record<Mode, string> = {
  standard: "",
  dyslexia: "a11y-print a11y-spacing-relaxed",
  adhd: "a11y-print a11y-spacing-loose",
  autism: "a11y-print a11y-spacing-relaxed",
  lowVision: "a11y-print a11y-font-xlarge a11y-spacing-relaxed",
};

/**
 * Question 5: switches between the same accessibility presets the real print page exposes
 * (`.a11y-print` + font-size / line-spacing modifiers from globals.css), live, on one question.
 */
export function AccessibilityDemo({
  modes,
  previewText,
}: {
  modes: { key: Mode; label: string }[];
  previewText: string;
}) {
  const [mode, setMode] = useState<Mode>("standard");

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex flex-wrap gap-1.5">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            aria-pressed={mode === m.key}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
              mode === m.key ? "border-brand bg-brand text-white" : "border-line text-ink-soft hover:border-brand/40 hover:text-ink",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mt-5 rounded-xl border border-black/10 bg-white p-5 text-black transition-[padding] duration-300",
          MODE_CLASSES[mode],
          mode === "autism" && "bg-[#fafafa]",
          mode === "lowVision" && "p-6",
        )}
      >
        <p className={cn("text-[15px] leading-relaxed", mode === "lowVision" && "font-semibold")}>{previewText}</p>
      </div>
    </div>
  );
}
