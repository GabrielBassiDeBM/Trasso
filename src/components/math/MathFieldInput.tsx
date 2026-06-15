"use client";

import { useEffect, useRef } from "react";
import type { MathfieldElement } from "mathlive";

interface MathFieldInputProps {
  value: string;
  onChange: (latex: string) => void;
  className?: string;
}

/** Wraps MathLive's <math-field> custom element for WYSIWYG LaTeX entry. */
export function MathFieldInput({ value, onChange, className }: MathFieldInputProps) {
  const ref = useRef<MathfieldElement>(null);

  useEffect(() => {
    import("mathlive");
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== value) {
      el.value = value;
    }
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleInput = () => onChange(el.value);
    el.addEventListener("input", handleInput);
    return () => el.removeEventListener("input", handleInput);
  }, [onChange]);

  return <math-field ref={ref} className={className} />;
}
