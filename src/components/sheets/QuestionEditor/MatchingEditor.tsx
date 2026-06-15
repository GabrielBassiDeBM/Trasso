"use client";

import type { MatchingItem, QuestionContent } from "@/lib/types/question";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { StatementEditor } from "./StatementEditor";

type MatchingContent = Extract<QuestionContent, { type: "matching" }>;
type Side = "left" | "right";

interface MatchingEditorProps {
  content: MatchingContent;
  onChange: (content: MatchingContent) => void;
}

export function MatchingEditor({ content, onChange }: MatchingEditorProps) {
  function updateItem(side: Side, index: number, text: string) {
    if (side === "left") {
      const left = content.left.map((item, i) => (i === index ? { ...item, text } : item));
      onChange({ ...content, left });
    } else {
      const right = content.right.map((item, i) => (i === index ? { ...item, text } : item));
      onChange({ ...content, right });
    }
  }

  function addItem(side: Side) {
    if (side === "left") {
      const nextKey = String(content.left.length + 1);
      onChange({ ...content, left: [...content.left, { key: nextKey, text: "" }] });
    } else {
      const nextKey = String.fromCharCode(97 + content.right.length);
      onChange({ ...content, right: [...content.right, { key: nextKey, text: "" }] });
    }
  }

  function removeItem(side: Side, index: number) {
    if (content[side].length <= 1) return;

    if (side === "left") {
      const removedKey = content.left[index].key;
      const left = content.left.filter((_, i) => i !== index);
      const pairs = { ...content.pairs };
      delete pairs[removedKey];
      onChange({ ...content, left, pairs });
    } else {
      const removedKey = content.right[index].key;
      const right = content.right.filter((_, i) => i !== index);
      const pairs = { ...content.pairs };
      for (const key of Object.keys(pairs)) {
        if (pairs[key] === removedKey) delete pairs[key];
      }
      onChange({ ...content, right, pairs });
    }
  }

  function setPair(leftKey: string, rightKey: string) {
    onChange({ ...content, pairs: { ...content.pairs, [leftKey]: rightKey } });
  }

  return (
    <div className="space-y-4">
      <StatementEditor value={content.statement} onChange={(statement) => onChange({ ...content, statement })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <MatchingColumn title="Coluna A" items={content.left} onUpdate={(index, text) => updateItem("left", index, text)} onAdd={() => addItem("left")} onRemove={(index) => removeItem("left", index)} />
        <MatchingColumn title="Coluna B" items={content.right} onUpdate={(index, text) => updateItem("right", index, text)} onAdd={() => addItem("right")} onRemove={(index) => removeItem("right", index)} />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Gabarito (associações)</span>
        <div className="space-y-2">
          {content.left.map((item) => (
            <div key={item.key} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 truncate font-medium text-ink">
                {item.key}. {item.text || "—"}
              </span>
              <span className="text-ink-faint">corresponde a</span>
              <Select value={content.pairs[item.key] ?? ""} onChange={(event) => setPair(item.key, event.target.value)} className="w-auto">
                <option value="">Selecione…</option>
                {content.right.map((right) => (
                  <option key={right.key} value={right.key}>
                    {right.key.toUpperCase()}. {right.text || "—"}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MatchingColumnProps {
  title: string;
  items: MatchingItem[];
  onUpdate: (index: number, text: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function MatchingColumn({ title, items, onUpdate, onAdd, onRemove }: MatchingColumnProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</span>
      {items.map((item, index) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className="w-6 text-sm font-semibold text-ink-soft">{item.key}</span>
          <Input value={item.text} onChange={(event) => onUpdate(index, event.target.value)} placeholder="Texto" />
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} disabled={items.length <= 1}>
            ×
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        + Adicionar item
      </Button>
    </div>
  );
}
