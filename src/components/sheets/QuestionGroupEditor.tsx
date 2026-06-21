"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookText, ChevronDown, ChevronUp, Heading, Trash2 } from "lucide-react";
import { removeGroupAction, updateGroupAction } from "@/lib/actions/groups";
import { Latex } from "@/components/math/Latex";
import { cn } from "@/lib/utils/cn";
import { useConfirm } from "@/lib/hooks/useConfirm";

export type BlockType = "passage" | "section_header";

export interface GroupItem {
  id: string;
  instructions: string | null;
  passage: string | null;
  passage_format: string;
  block_type: BlockType;
  title: string | null;
  position: number;
  level: number;
}

interface QuestionGroupEditorProps {
  group: GroupItem;
  onGroupChange: (group: GroupItem) => void;
  onGroupRemove: () => void;
  dragHandle?: ReactNode;
}

export function QuestionGroupEditor({ group, onGroupChange, onGroupRemove, dragHandle }: QuestionGroupEditorProps) {
  if (group.block_type === "section_header") {
    return (
      <SectionHeaderEditor group={group} onGroupChange={onGroupChange} onGroupRemove={onGroupRemove} dragHandle={dragHandle} />
    );
  }
  return (
    <PassageEditor group={group} onGroupChange={onGroupChange} onGroupRemove={onGroupRemove} dragHandle={dragHandle} />
  );
}

function PassageEditor({ group, onGroupChange, onGroupRemove, dragHandle }: QuestionGroupEditorProps) {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [collapsed, setCollapsed] = useState(false);
  const [localPassage, setLocalPassage] = useState(group.passage ?? "");
  const [localInstructions, setLocalInstructions] = useState(group.instructions ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const ok = await confirm({
      title: "Remove block",
      message: "Remove this passage block? Its text and instructions will be deleted.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    await removeGroupAction(group.id);
    onGroupRemove();
  }

  return (
    <>
      <div className="rounded-2xl border-2 border-brand/20 bg-brand-soft/30">
        {/* Group header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-brand/10">
          {dragHandle}
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

            <p className="text-xs text-ink-faint">
              Drag this block to position it relative to the questions it should introduce.
            </p>
          </div>
        )}
      </div>
      {confirmDialog}
    </>
  );
}

function SectionHeaderEditor({ group, onGroupChange, onGroupRemove, dragHandle }: QuestionGroupEditorProps) {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [localTitle, setLocalTitle] = useState(group.title ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateGroupAction(group.id, { title: localTitle || null });
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTitle]);

  async function handleRemoveGroup() {
    const ok = await confirm({
      title: "Remove section",
      message: "Remove this section header?",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    await removeGroupAction(group.id);
    onGroupRemove();
  }

  const isSubLevel = group.level === 2;

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border-2 border-accent/20 bg-accent-soft/30",
          isSubLevel && "ml-6 border-accent/10 bg-accent-soft/15",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          {dragHandle}
          <Heading size={isSubLevel ? 13 : 15} className="text-accent-dark shrink-0" />
          <input
            value={localTitle}
            onChange={(e) => {
              setLocalTitle(e.target.value);
              onGroupChange({ ...group, title: e.target.value });
            }}
            placeholder={isSubLevel ? "Sub-section title, e.g. Topic: Fractions" : "Section title, e.g. Section 2: Free Response"}
            className={cn(
              "flex-1 rounded-md border border-transparent bg-transparent px-1 font-semibold text-accent-dark placeholder:text-accent-dark/50 focus:border-line focus:bg-canvas focus:outline-none",
              isSubLevel ? "text-xs" : "text-sm",
            )}
          />
          <button
            type="button"
            onClick={handleRemoveGroup}
            className="rounded-lg p-1 text-ink-faint hover:text-danger"
            aria-label="Remove section header"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
