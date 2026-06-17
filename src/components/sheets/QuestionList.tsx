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
import { Wand2, Camera, BookText, Library } from "lucide-react";
import type { QuestionType } from "@/lib/types/database";
import type { SubjectRow, TopicRow } from "@/lib/data/sheets";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionContent } from "@/lib/types/question";
import { addQuestionAction } from "@/lib/actions/questions";
import { addGroupAction, reorderSheetEntitiesAction, type SheetEntityRef } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionEditorShell } from "./QuestionEditor/QuestionEditorShell";
import { QuestionGroupEditor, type GroupItem } from "./QuestionGroupEditor";
import { ScanModal } from "@/components/ai/ScanModal";
import { GenerateModal } from "@/components/ai/GenerateModal";
import { BankPickerModal } from "./BankPickerModal";

export interface QuestionItem {
  sheetQuestionId: string;
  questionId: string;
  points: number | null;
  content: QuestionContent;
  inlineImages?: string[];
  position?: number;
}

interface QuestionListProps {
  sheetId: string;
  items: QuestionItem[];
  groups: GroupItem[];
  pointsPerQuestion: boolean;
  onItemsChange: (items: QuestionItem[]) => void;
  onGroupsChange: (groups: GroupItem[]) => void;
  subjects: SubjectRow[];
  allTopics: TopicRow[];
  defaultSubjectIds: string[];
  defaultTopicIds: string[];
  defaultDifficulties: string[];
}

// ─── Unified ordering ───────────────────────────────────────────────────────
// Questions and passage blocks share one position axis (see reorderSheetEntitiesAction),
// so they're merged into a single sortable list here.

type Entry =
  | { dndId: string; kind: "item"; position: number; item: QuestionItem }
  | { dndId: string; kind: "group"; position: number; group: GroupItem };

function groupDndId(groupId: string) {
  return `group:${groupId}`;
}

function buildEntries(items: QuestionItem[], groups: GroupItem[]): Entry[] {
  const entries: Entry[] = [
    ...items.map((item, i) => ({ dndId: item.sheetQuestionId, kind: "item" as const, position: item.position ?? i, item })),
    ...groups.map((group, i) => ({ dndId: groupDndId(group.id), kind: "group" as const, position: group.position ?? i, group })),
  ];
  return entries.sort((a, b) => a.position - b.position);
}

function withQuestionNumber(entries: Entry[]): { entry: Entry; questionIndex: number }[] {
  let index = 0;
  return entries.map((entry) => {
    if (entry.kind !== "item") return { entry, questionIndex: -1 };
    const questionIndex = index;
    index += 1;
    return { entry, questionIndex };
  });
}

export function QuestionList({
  sheetId,
  items,
  groups,
  pointsPerQuestion,
  onItemsChange,
  onGroupsChange,
  subjects,
  allTopics,
  defaultSubjectIds,
  defaultTopicIds,
  defaultDifficulties,
}: QuestionListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [adding, setAdding] = useState<QuestionType | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  const entries = buildEntries(items, groups);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((entry) => entry.dndId === active.id);
    const newIndex = entries.findIndex((entry) => entry.dndId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(entries, oldIndex, newIndex);

    const nextItems: QuestionItem[] = [];
    const nextGroups: GroupItem[] = [];
    const refs: SheetEntityRef[] = [];

    reordered.forEach((entry, position) => {
      if (entry.kind === "item") {
        nextItems.push({ ...entry.item, position });
        refs.push({ id: entry.item.sheetQuestionId, kind: "item" });
      } else {
        nextGroups.push({ ...entry.group, position });
        refs.push({ id: entry.group.id, kind: "group" });
      }
    });

    onItemsChange(nextItems);
    onGroupsChange(nextGroups);
    reorderSheetEntitiesAction(sheetId, refs);
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
        position: result.position,
      },
    ]);
  }

  async function handleAddGroup() {
    setAddingGroup(true);
    const result = await addGroupAction(sheetId, items.length + groups.length);
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
        position: result.position,
      });
    }
    if (added.length > 0) onItemsChange([...items, ...added]);
  }

  const indexedEntries = withQuestionNumber(entries);

  return (
    <div className="space-y-4">
      {items.length === 0 && groups.length === 0 && (
        <Card className="p-6 text-center text-sm text-ink-soft">
          No questions yet. Add the first one using the buttons below.
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((entry) => entry.dndId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {indexedEntries.map(({ entry, questionIndex }) =>
              entry.kind === "item" ? (
                <SortableQuestionItem
                  key={entry.dndId}
                  dndId={entry.dndId}
                  item={entry.item}
                  index={questionIndex}
                  sheetId={sheetId}
                  onContentChange={(content) => updateItemContent(entry.item.sheetQuestionId, content)}
                  onRemoved={() => removeItem(entry.item.sheetQuestionId)}
                  pointsPerQuestion={pointsPerQuestion}
                />
              ) : (
                <SortableGroupBlock
                  key={entry.dndId}
                  dndId={entry.dndId}
                  group={entry.group}
                  onGroupChange={(updated) =>
                    onGroupsChange(groups.map((g) => (g.id === updated.id ? updated : g)))
                  }
                  onGroupRemove={() => onGroupsChange(groups.filter((g) => g.id !== entry.group.id))}
                />
              ),
            )}
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
            <Camera size={14} className="text-accent-dark" />
            Scan photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBankOpen(true)}
          >
            <Library size={14} className="text-accent-dark" />
            Browse question bank
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
      <BankPickerModal
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        sheetId={sheetId}
        items={items}
        subjects={subjects}
        allTopics={allTopics}
        defaultSubjectIds={defaultSubjectIds}
        defaultTopicIds={defaultTopicIds}
        defaultDifficulties={defaultDifficulties}
        onAddItem={(item) => onItemsChange([...items, item])}
        onRemoveItem={removeItem}
      />
    </div>
  );
}

// ─── Sortable wrappers ────────────────────────────────────────────────────────

function DragHandle({ attributes, listeners, label }: { attributes: ReturnType<typeof useSortable>["attributes"]; listeners: ReturnType<typeof useSortable>["listeners"]; label: string }) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none rounded-md p-1 text-ink-faint hover:bg-canvas hover:text-ink active:cursor-grabbing"
      aria-label={label}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM15 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
      </svg>
    </button>
  );
}

interface SortableQuestionItemProps {
  dndId: string;
  item: QuestionItem;
  index: number;
  sheetId: string;
  pointsPerQuestion: boolean;
  onContentChange: (content: QuestionContent) => void;
  onRemoved: () => void;
}

function SortableQuestionItem({ dndId, item, index, sheetId, pointsPerQuestion, onContentChange, onRemoved }: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dndId });

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
        showPoints={pointsPerQuestion}
        onContentChange={onContentChange}
        onRemoved={onRemoved}
        dragHandle={<DragHandle attributes={attributes} listeners={listeners} label="Reorder question" />}
      />
    </div>
  );
}

interface SortableGroupBlockProps {
  dndId: string;
  group: GroupItem;
  onGroupChange: (group: GroupItem) => void;
  onGroupRemove: () => void;
}

function SortableGroupBlock({ dndId, group, onGroupChange, onGroupRemove }: SortableGroupBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dndId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionGroupEditor
        group={group}
        onGroupChange={onGroupChange}
        onGroupRemove={onGroupRemove}
        dragHandle={<DragHandle attributes={attributes} listeners={listeners} label="Reorder passage block" />}
      />
    </div>
  );
}
