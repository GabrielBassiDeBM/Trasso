"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Latex } from "@/components/math/Latex";
import { MathFieldInput } from "@/components/math/MathFieldInput";

interface StatementEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  label?: string;
}

export function StatementEditor({ value, onChange, rows = 3, placeholder, label = "Enunciado" }: StatementEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMath, setShowMath] = useState(false);
  const [mathValue, setMathValue] = useState("");

  function insertMath() {
    const latex = mathValue.trim();
    if (!latex) return;
    const snippet = `$${latex}$`;
    const textarea = textareaRef.current;

    if (!textarea) {
      onChange(value + snippet);
    } else {
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      onChange(value.slice(0, start) + snippet + value.slice(end));

      requestAnimationFrame(() => {
        const cursor = start + snippet.length;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    }

    setMathValue("");
    setShowMath(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowMath((open) => !open)}>
          {showMath ? "Fechar editor de fórmula" : "Inserir equação"}
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
      />

      {showMath && (
        <div className="rounded-lg border border-ink/10 bg-canvas p-3">
          <MathFieldInput value={mathValue} onChange={setMathValue} className="w-full" />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowMath(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={insertMath} disabled={!mathValue.trim()}>
              Inserir no enunciado
            </Button>
          </div>
        </div>
      )}

      {value.trim() && (
        <div className="rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-sm text-ink">
          <Latex text={value} />
        </div>
      )}
    </div>
  );
}
