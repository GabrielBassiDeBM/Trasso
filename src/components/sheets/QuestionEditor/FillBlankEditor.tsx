"use client";

import type { QuestionContent } from "@/lib/types/question";
import { Input, Label } from "@/components/ui/Input";
import { StatementEditor } from "./StatementEditor";

type FillBlankContent = Extract<QuestionContent, { type: "fill_blank" }>;

const BLANK_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

function extractBlankKeys(statement: string): string[] {
  const keys: string[] = [];
  for (const match of statement.matchAll(BLANK_PATTERN)) {
    if (!keys.includes(match[1])) keys.push(match[1]);
  }
  return keys;
}

interface FillBlankEditorProps {
  content: FillBlankContent;
  onChange: (content: FillBlankContent) => void;
}

export function FillBlankEditor({ content, onChange }: FillBlankEditorProps) {
  const keys = extractBlankKeys(content.statement);

  function updateStatement(statement: string) {
    const nextKeys = extractBlankKeys(statement);
    const blanks: Record<string, string> = {};
    for (const key of nextKeys) blanks[key] = content.blanks[key] ?? "";
    onChange({ ...content, statement, blanks });
  }

  function updateBlank(key: string, value: string) {
    onChange({ ...content, blanks: { ...content.blanks, [key]: value } });
  }

  return (
    <div className="space-y-4">
      <StatementEditor
        value={content.statement}
        onChange={updateStatement}
        placeholder="Use {{1}}, {{2}}… para marcar as lacunas no texto"
      />

      {keys.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Respostas das lacunas</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {keys.map((key) => (
              <div key={key}>
                <Label>Lacuna {key}</Label>
                <Input value={content.blanks[key] ?? ""} onChange={(event) => updateBlank(key, event.target.value)} placeholder="Resposta correta" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-faint">
          Adicione marcadores como <code>{"{{1}}"}</code> no enunciado para criar lacunas a preencher.
        </p>
      )}
    </div>
  );
}
