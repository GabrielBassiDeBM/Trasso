"use client";

import { useEffect, useRef, useState } from "react";
import { Accessibility } from "lucide-react";
import type { PageSettings } from "@/lib/sheets/defaults";
import { updatePageSettingsAction, updateAccessibilityAction } from "@/lib/actions/sheets";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface AccessibilitySettings {
  enabled: boolean;
  font: "opendyslexic";
  fontSize: "normal" | "large" | "xlarge";
  lineSpacing: "normal" | "relaxed" | "loose";
  columns: 1;
  contrast: "normal" | "high";
  extraAnswerSpace: boolean;
}

interface PageSettingsPanelProps {
  sheetId: string;
  settings: PageSettings;
  accessibility?: AccessibilitySettings;
  onChange: (settings: PageSettings) => void;
  onAccessibilityChange?: (a: AccessibilitySettings) => void;
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  enabled: false,
  font: "opendyslexic",
  fontSize: "large",
  lineSpacing: "relaxed",
  columns: 1,
  contrast: "normal",
  extraAnswerSpace: false,
};

export function PageSettingsPanel({ sheetId, settings, accessibility, onChange, onAccessibilityChange }: PageSettingsPanelProps) {
  const a11y = accessibility ?? DEFAULT_ACCESSIBILITY;
  const [showA11y, setShowA11y] = useState(a11y.enabled);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const a11ySaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);
  const skipFirstA11y = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updatePageSettingsAction(sheetId, settings);
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  useEffect(() => {
    if (skipFirstA11y.current) {
      skipFirstA11y.current = false;
      return;
    }
    if (a11ySaveTimer.current) clearTimeout(a11ySaveTimer.current);
    a11ySaveTimer.current = setTimeout(() => {
      updateAccessibilityAction(sheetId, a11y as unknown as Record<string, unknown>);
    }, 600);
    return () => { if (a11ySaveTimer.current) clearTimeout(a11ySaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a11y]);

  function updateA11y(updates: Partial<AccessibilitySettings>) {
    const next = { ...a11y, ...updates };
    onAccessibilityChange?.(next);
  }

  function updateMargin(key: keyof PageSettings["margins"], value: number) {
    onChange({ ...settings, margins: { ...settings.margins, [key]: value } });
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-display text-base font-semibold text-ink">Page settings</h2>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Size</span>
        <p className="mt-1 text-sm text-ink-soft">A4 (210 × 297 mm)</p>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Margins (mm)</span>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MarginInput label="Top" value={settings.margins.top} onChange={(value) => updateMargin("top", value)} />
          <MarginInput label="Right" value={settings.margins.right} onChange={(value) => updateMargin("right", value)} />
          <MarginInput label="Bottom" value={settings.margins.bottom} onChange={(value) => updateMargin("bottom", value)} />
          <MarginInput label="Left" value={settings.margins.left} onChange={(value) => updateMargin("left", value)} />
        </div>
      </div>

      <SegmentedField
        label="Columns"
        value={String(settings.columns)}
        options={[
          { value: "1", label: "1 column" },
          { value: "2", label: "2 columns" },
        ]}
        onChange={(value) => onChange({ ...settings, columns: Number(value) === 2 ? 2 : 1 })}
      />

      <SegmentedField
        label="Question numbering"
        value={settings.numbering}
        options={[
          { value: "numeric", label: "Numeric" },
          { value: "none", label: "None" },
        ]}
        onChange={(value) => onChange({ ...settings, numbering: value === "none" ? "none" : "numeric" })}
      />

      <SegmentedField
        label="MCQ style"
        value={settings.mcqStyle}
        options={[
          { value: "lettered", label: "A, B, C…" },
          { value: "bubble", label: "Bubbles" },
        ]}
        onChange={(value) => onChange({ ...settings, mcqStyle: value === "bubble" ? "bubble" : "lettered" })}
      />

      <div className="max-w-[10rem]">
        <Label htmlFor="default-answer-lines">Answer lines (default)</Label>
        <Input
          id="default-answer-lines"
          type="number"
          min={0}
          max={20}
          value={settings.answerLines}
          onChange={(event) => onChange({ ...settings, answerLines: Number(event.target.value) })}
        />
      </div>

      {/* Accessibility variant */}
      <div className="border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Accessibility size={16} className="text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Accessible variant
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !showA11y;
              setShowA11y(next);
              updateA11y({ enabled: next });
            }}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              showA11y ? "bg-brand" : "bg-[#d1d5db]"
            )}
            role="switch"
            aria-checked={showA11y}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                showA11y ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {showA11y && (
          <div className="mt-4 space-y-4 rounded-xl bg-brand-soft/50 p-4">
            <p className="text-xs text-ink-soft">
              Generates a second print-ready version with an adapted font, increased spacing, and single column — same content, re-typeset for accessibility.
            </p>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Font</span>
              <p className="mt-1 text-sm text-ink">OpenDyslexic</p>
            </div>

            <SegmentedField
              label="Text size"
              value={a11y.fontSize}
              options={[
                { value: "normal", label: "Normal" },
                { value: "large", label: "Large" },
                { value: "xlarge", label: "X-Large" },
              ]}
              onChange={(v) => updateA11y({ fontSize: v as "normal" | "large" | "xlarge" })}
            />

            <SegmentedField
              label="Line spacing"
              value={a11y.lineSpacing}
              options={[
                { value: "normal", label: "Normal" },
                { value: "relaxed", label: "Relaxed" },
                { value: "loose", label: "Loose" },
              ]}
              onChange={(v) => updateA11y({ lineSpacing: v as "normal" | "relaxed" | "loose" })}
            />

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={a11y.extraAnswerSpace}
                onChange={(e) => updateA11y({ extraAnswerSpace: e.target.checked })}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              <span className="text-sm text-ink">Extra answer space</span>
            </label>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand text-white px-4 py-2 text-xs font-semibold hover:opacity-90"
              onClick={() => {
                const match = window.location.pathname.match(/\/sheets\/([^/]+)/);
                const id = match?.[1];
                if (id) window.open(`/sheets/${id}/print?a11y=1`, "_blank");
              }}
            >
              Print accessible version
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function MarginInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" min={0} max={50} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

interface SegmentedFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SegmentedField({ label, value, options, onChange }: SegmentedFieldProps) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <div className="mt-2 inline-flex rounded-full border border-line bg-canvas p-1 text-sm">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              value === option.value ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
