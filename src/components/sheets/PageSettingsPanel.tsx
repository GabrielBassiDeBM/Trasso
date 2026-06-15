"use client";

import { useEffect, useRef } from "react";
import type { PageSettings } from "@/lib/sheets/defaults";
import { updatePageSettingsAction } from "@/lib/actions/sheets";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

interface PageSettingsPanelProps {
  sheetId: string;
  settings: PageSettings;
  onChange: (settings: PageSettings) => void;
}

export function PageSettingsPanel({ sheetId, settings, onChange }: PageSettingsPanelProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);

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

  function updateMargin(key: keyof PageSettings["margins"], value: number) {
    onChange({ ...settings, margins: { ...settings.margins, [key]: value } });
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-display text-base font-semibold text-ink">Configurações da página</h2>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Tamanho</span>
        <p className="mt-1 text-sm text-ink-soft">A4 (210 × 297 mm)</p>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Margens (mm)</span>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MarginInput label="Superior" value={settings.margins.top} onChange={(value) => updateMargin("top", value)} />
          <MarginInput label="Direita" value={settings.margins.right} onChange={(value) => updateMargin("right", value)} />
          <MarginInput label="Inferior" value={settings.margins.bottom} onChange={(value) => updateMargin("bottom", value)} />
          <MarginInput label="Esquerda" value={settings.margins.left} onChange={(value) => updateMargin("left", value)} />
        </div>
      </div>

      <SegmentedField
        label="Colunas"
        value={String(settings.columns)}
        options={[
          { value: "1", label: "1 coluna" },
          { value: "2", label: "2 colunas" },
        ]}
        onChange={(value) => onChange({ ...settings, columns: Number(value) === 2 ? 2 : 1 })}
      />

      <SegmentedField
        label="Numeração das questões"
        value={settings.numbering}
        options={[
          { value: "numeric", label: "Numérica" },
          { value: "none", label: "Sem numeração" },
        ]}
        onChange={(value) => onChange({ ...settings, numbering: value === "none" ? "none" : "numeric" })}
      />

      <SegmentedField
        label="Estilo de alternativas"
        value={settings.mcqStyle}
        options={[
          { value: "lettered", label: "A, B, C…" },
          { value: "bubble", label: "Bolhas" },
        ]}
        onChange={(value) => onChange({ ...settings, mcqStyle: value === "bubble" ? "bubble" : "lettered" })}
      />

      <div className="max-w-[10rem]">
        <Label htmlFor="default-answer-lines">Linhas de resposta (padrão)</Label>
        <Input
          id="default-answer-lines"
          type="number"
          min={0}
          max={20}
          value={settings.answerLines}
          onChange={(event) => onChange({ ...settings, answerLines: Number(event.target.value) })}
        />
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
      <div className="mt-2 inline-flex rounded-full border border-ink/10 bg-canvas p-1 text-sm">
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
