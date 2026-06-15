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
import type { QuestionType } from "@/lib/types/database";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionContent } from "@/lib/types/question";
import { addQuestionAction, reorderQuestionsAction } from "@/lib/actions/questions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionEditorShell } from "./QuestionEditor/QuestionEditorShell";

export interface QuestionItem {
  sheetQuestionId: string;
  questionId: string;
  points: number | null;
  content: QuestionContent;
}

interface QuestionListProps {
  sheetId: string;
  items: QuestionItem[];
  onItemsChange: (items: QuestionItem[]) => void;
}

export function QuestionList({ sheetId, items, onItemsChange }: QuestionListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [adding, setAdding] = useState<QuestionType | null>(null);

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
      { sheetQuestionId: result.sheetQuestionId, questionId: result.questionId, points: 1, content: result.content },
    ]);
  }

  function updateItemContent(sheetQuestionId: string, content: QuestionContent) {
    onItemsChange(items.map((item) => (item.sheetQuestionId === sheetQuestionId ? { ...item, content } : item)));
  }

  function removeItem(sheetQuestionId: string) {
    onItemsChange(items.filter((item) => item.sheetQuestionId !== sheetQuestionId));
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <Card className="p-6 text-center text-sm text-ink-soft">
          Nenhuma questão ainda. Adicione a primeira usando os botões abaixo.
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.sheetQuestionId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {items.map((item, index) => (
              <SortableQuestionItem
                key={item.sheetQuestionId}
                item={item}
                index={index}
                sheetId={sheetId}
                onContentChange={(content) => updateItemContent(item.sheetQuestionId, content)}
                onRemoved={() => removeItem(item.sheetQuestionId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Card className="p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Adicionar questão</p>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((type) => (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => handleAdd(type)} disabled={adding !== null}>
              {adding === type ? "Adicionando…" : QUESTION_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface SortableQuestionItemProps {
  item: QuestionItem;
  index: number;
  sheetId: string;
  onContentChange: (content: QuestionContent) => void;
  onRemoved: () => void;
}

function SortableQuestionItem({ item, index, sheetId, onContentChange, onRemoved }: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.sheetQuestionId });

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
            aria-label="Reordenar questão"
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
