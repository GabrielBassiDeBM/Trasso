"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const fieldStyles =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint shadow-xs transition-all duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 hover:border-brand/40";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldStyles, "h-10", className)} {...props} />;
}

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max"> {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
}

/**
 * Numeric input that buffers what the user types: the field can be cleared and
 * retyped freely (a plain controlled `type="number"` snaps to a clamped value on
 * every keystroke, forcing the spinner arrows). Commits valid in-range integers
 * as typed; clamps/restores on blur.
 */
export function NumberField({ value, onValueChange, min, max, className, ...props }: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  // Adjust buffered text when the committed value changes from outside
  // (React's sanctioned "adjust state during render" pattern).
  if (value !== prevValue) {
    setPrevValue(value);
    if (Number(text) !== value) setText(String(value));
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const parsed = Number(raw);
        if (raw !== "" && Number.isInteger(parsed) && parsed >= min && parsed <= max) {
          setPrevValue(parsed);
          onValueChange(parsed);
        }
      }}
      onBlur={(event) => {
        const parsed = Number(event.target.value);
        const clamped = event.target.value === "" || Number.isNaN(parsed)
          ? value
          : Math.max(min, Math.min(max, Math.round(parsed)));
        setText(String(clamped));
        if (clamped !== value) {
          setPrevValue(clamped);
          onValueChange(clamped);
        }
      }}
      className={cn(fieldStyles, "h-10", className)}
      {...props}
    />
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldStyles, "min-h-24 resize-y", className)} {...props} />;
  },
);

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          fieldStyles,
          "h-10 appearance-none pr-10 cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
        aria-hidden="true"
      />
    </div>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft", className)}
      {...props}
    />
  );
}
