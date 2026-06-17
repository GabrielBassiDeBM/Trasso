"use client";

import { useEffect, useRef, useState } from "react";
import { BookText, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { QuestionType } from "@/lib/types/database";
import type { QuestionContent } from "@/lib/types/question";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from "@/lib/types/question";
import { removeGroupAction, updateGroupAction } from "@/lib/actions/groups";
import { addQuestionAction } from "@/lib/actions/questions";
import type { QuestionItem } from "./QuestionList";
import { QuestionEditorShell } from "./QuestionEditor/QuestionEditorShell";
import { Button } from "@/components/ui/Button";
import { Latex } from "@/components/math/Latex";

export interface GroupItem {
  id: string;
  instructions: string | null;
  passage: string | null;
  passage_format: string;
  position: number;
}

interface QuestionGroupEditorProps {
  sheetId: string;
  group: GroupItem;
  items: QuestionItem[];
  allItems: QuestionItem[];
  onGroupChange: (group: GroupItem) => void;
  onGroupRemove: () => void;
  onItemsChange: (items: QuestionItem[]) => void;
  onItemRemove: (id: string) => void;
  onAddQuestion: (type: QuestionType) => void;
  adding: QuestionType | null;
  pointsPerQuestion: boolean;
}

export function QuestionGroupEditor({
  sheetId,
  group,
  items,
  allItems,
  onGroupChange,
  onGroupRemove,
  onItemsChange,
  adding,
  pointsPerQuestion,
}: QuestionGroupEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [localPassage, setLocalPassage] = useState(group.passage ?? "");
  const [localInstructions, setLocalInstructions] = useState(group.instructions ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addingInGroup, setAddingInGroup] = useState<QuestionType | null>(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateGroupAction(group.id, {
        passage: localPassage || null,
        instructions: localInstructions || null,
      });
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPassage, localInstructions]);

  async function handleRemoveGroup() {
    if (!confirm("Remove this passage block and all its linked questions?")) return;
    await removeGroupAction(group.id);
    onGroupRemove();
    const groupQIds = new Set(items.map((i) => i.sheetQuestionId));
    onItemsChange(allItems.filter((i) => !groupQIds.has(i.sheetQuestionId)));
  }

  async function handleAddInGroup(type: QuestionType) {
    setAddingInGroup(type);
    const result = await addQuestionAction(sheetId, type, undefined, group.id);
    setAddingInGroup(null);

    if ("error" in result) {
      alert(result.error);
      return;
    }

    onItemsChange([
      ...allItems,
      {
        sheetQuestionId: result.sheetQuestionId,
        questionId: result.questionId,
        points: 1,
        content: result.content,
        groupId: group.id,
      },
    ]);
  }

  function updateItemInGroup(sqId: string, content: QuestionContent) {
    onItemsChange(allItems.map((item) =>
      item.sheetQuestionId === sqId ? { ...item, content } : item
    ));
  }

  function removeItemFromGroup(sqId: string) {
    onItemsChange(allItems.filter((item) => item.sheetQuestionId !== sqId));
  }

  return (
    <div className="rounded-2xl border-2 border-brand/20 bg-brand-soft/30">
      {/* Group header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-brand/10">
        <BookText size={15} className="text-brand shrink-0" />
        <span className="flex-1 text-sm font-semibold text-brand-dark">Passage / reading block</span>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-lg p-1 text-ink-faint hover:text-ink"
          aria-label={collapsed ? "Expand block" : "Collapse block"}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button
          type="button"
          onClick={handleRemoveGroup}
          className="rounded-lg p-1 text-ink-faint hover:text-danger"
          aria-label="Remove block"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-4">
          {/* Passage text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Passage text
            </label>
            <textarea
              value={localPassage}
              onChange={(e) => {
                setLocalPassage(e.target.value);
                onGroupChange({ ...group, passage: e.target.value });
              }}
              rows={5}
              placeholder="Paste or write the reading passage here…"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-y"
            />
            {localPassage && (
              <div className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
                <Latex text={localPassage} />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Instructions (optional)
            </label>
            <textarea
              value={localInstructions}
              onChange={(e) => {
                setLocalInstructions(e.target.value);
                onGroupChange({ ...group, instructions: e.target.value });
              }}
              rows={2}
              placeholder="e.g. Read the passage and answer the following questions."
              className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Questions in this group */}
          {items.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Questions in this block ({items.length})
              </p>
              {items.map((item, idx) => (
                <QuestionEditorShell
                  key={item.sheetQuestionId}
                  sheetId={sheetId}
                  sheetQuestionId={item.sheetQuestionId}
                  questionId={item.questionId}
                  index={idx}
                  content={item.content}
                  points={item.points}
                  showPoints={pointsPerQuestion}
                  onContentChange={(c) => updateItemInGroup(item.sheetQuestionId, c)}
                  onRemoved={() => removeItemFromGroup(item.sheetQuestionId)}
                />
              ))}
            </div>
          )}

          {/* Add question to group */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Add question to block
            </p>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddInGroup(type)}
                  disabled={addingInGroup !== null}
                >
                  {addingInGroup === type ? "Adding…" : QUESTION_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
