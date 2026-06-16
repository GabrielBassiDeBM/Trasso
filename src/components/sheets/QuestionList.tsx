"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Wand2, Camera, BookText } from "lucide-react";
import type { QuestionType } from "@/lib/types/database";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionContent } from "@/lib/types/question";
import { addQuestionAction, reorderQuestionsAction } from "@/lib/actions/questions";
import { addGroupAction } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionEditorShell } from "./QuestionEditor/QuestionEditorShell";
import { QuestionGroupEditor, type GroupItem } from "./QuestionGroupEditor";
import { ScanModal } from "@/components/ai/ScanModal";
import { GenerateModal } from "@/components/ai/GenerateModal";

export interface QuestionItem {
  sheetQuestionId: string;
  questionId: string;
  points: number | null;
  content: QuestionContent;
  groupId?: string | null;
  inlineImages?: string[];
}

interface QuestionListProps {
  sheetId: string;
  items: QuestionItem[];
  groups: GroupItem[];
  onItemsChange: (items: QuestionItem[]) => void;
  onGroupsChange: (groups: GroupItem[]) => void;
}

export function QuestionList({ sheetId, items, groups, onItemsChange, onGroupsChange }: QuestionListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [adding, setAdding] = useState<QuestionType | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.sheetQuestionId === active.id);
    const newIndex = items.findIndex((item) => item.sheetQuestionId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    onItemsChange(next);
    reorderQuestionsAction(sheetId, next.map((item) => item.sheetQuestionId));
  }

  async function handleAdd(type: QuestionType) {
    setAdding(type);
    const result = await addQuestionAction(sheetId, type);
    setAdding(null);

    if ("error" in result) {
      alert(result.error);
      return;
    }

    onItemsChange([
      ...items,
      {
        sheetQuestionId: result.sheetQuestionId,
        questionId: result.questionId,
        points: 1,
        content: result.content,
      },
    ]);
  }

  async function handleAddGroup() {
    setAddingGroup(true);
    const result = await addGroupAction(sheetId, items.length);
    setAddingGroup(false);

    if ("error" in result) {
      alert(result.error);
      return;
    }

    onGroupsChange([...groups, result]);
  }

  function updateItemContent(sheetQuestionId: string, content: QuestionContent) {
    onItemsChange(items.map((item) => (item.sheetQuestionId === sheetQuestionId ? { ...item, content } : item)));
  }

  function removeItem(sheetQuestionId: string) {
    onItemsChange(items.filter((item) => item.sheetQuestionId !== sheetQuestionId));
  }

  async function handleAiAccept(questions: QuestionContent[]) {
    const added: QuestionItem[] = [];
    for (const q of questions) {
      const result = await addQuestionAction(sheetId, q.type, q);
      if ("error" in result) continue;
      added.push({
        sheetQuestionId: result.sheetQuestionId,
        questionId: result.questionId,
        points: 1,
        content: result.content,
      });
    }
    if (added.length > 0) onItemsChange([...items, ...added]);
  }

  // Items not belonging to any group
  const ungroupedItems = items.filter((item) => !item.groupId);
  // Items belonging to each group
  const itemsByGroup = (groupId: string) => items.filter((item) => item.groupId === groupId);

  return (
    <div className="space-y-4">
      {/* Passage groups */}
      {groups.map((group) => (
        <QuestionGroupEditor
          key={group.id}
          sheetId={sheetId}
          group={group}
          items={itemsByGroup(group.id)}
          allItems={items}
          onGroupChange={(updated) =>
            onGroupsChange(groups.map((g) => (g.id === group.id ? updated : g)))
          }
          onGroupRemove={() => onGroupsChange(groups.filter((g) => g.id !== group.id))}
          onItemsChange={onItemsChange}
          onItemRemove={removeItem}
          onAddQuestion={handleAdd}
          adding={adding}
        />
      ))}

      {/* Ungrouped questions */}
      {ungroupedItems.length === 0 && groups.length === 0 && (
        <Card className="p-6 text-center text-sm text-ink-soft">
          No questions yet. Add the first one using the buttons below.
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={ungroupedItems.map((item) => item.sheetQuestionId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {ungroupedItems.map((item, index) => (
              <SortableQuestionItem
                key={item.sheetQuestionId}
                item={item}
                index={items.indexOf(item)}
                sheetId={sheetId}
                onContentChange={(content) => updateItemContent(item.sheetQuestionId, content)}
                onRemoved={() => removeItem(item.sheetQuestionId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add controls */}
      <Card className="p-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Add question</p>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdd(type)}
                disabled={adding !== null}
              >
                {adding === type ? "Adding…" : QUESTION_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddGroup}
            disabled={addingGroup}
          >
            <BookText size={14} />
            {addingGroup ? "Adding…" : "Passage / reading block"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGenerateOpen(true)}
          >
            <Wand2 size={14} className="text-brand" />
            Generate with AI
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setScanOpen(true)}
          >
            <Camera size={14} className="text-[#1187f0]" />
            Scan photo
          </Button>
        </div>
      </Card>

      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onAccept={handleAiAccept}
      />
      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onAccept={handleAiAccept}
      />
    </div>
  );
}

// ─── Sortable wrapper ─────────────────────────────────────────────────────────

interface SortableQuestionItemProps {
  item: QuestionItem;
  index: number;
  sheetId: string;
  onContentChange: (content: QuestionContent) => void;
  onRemoved: () => void;
}

function SortableQuestionItem({ item, index, sheetId, onContentChange, onRemoved }: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.sheetQuestionId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionEditorShell
        sheetId={sheetId}
        sheetQuestionId={item.sheetQuestionId}
        questionId={item.questionId}
        index={index}
        content={item.content}
        points={item.points}
        onContentChange={onContentChange}
        onRemoved={onRemoved}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded-md p-1 text-ink-faint hover:bg-canvas hover:text-ink active:cursor-grabbing"
            aria-label="Reorder question"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM15 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
            </svg>
          </button>
        }
      />
    </div>
  );
}
