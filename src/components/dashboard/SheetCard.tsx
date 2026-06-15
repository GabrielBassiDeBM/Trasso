"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { renameSheetAction, deleteSheetAction } from "@/lib/actions/sheets";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import type { SheetRow } from "@/lib/data/sheets";

const STATUS_LABELS: Record<SheetRow["status"], string> = {
  draft: "Rascunho",
  ready: "Pronta",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function SheetCard({ sheet }: { sheet: SheetRow }) {
  const [title, setTitle] = useState(sheet.title);
  const [, startTransition] = useTransition();

  function handleRename() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === sheet.title) {
      setTitle(sheet.title);
      return;
    }

    const formData = new FormData();
    formData.set("id", sheet.id);
    formData.set("title", trimmed);
    startTransition(() => {
      renameSheetAction(formData);
    });
  }

  function handleDelete() {
    if (!confirm(`Excluir "${sheet.title}"? Essa ação não pode ser desfeita.`)) return;

    const formData = new FormData();
    formData.set("id", sheet.id);
    startTransition(() => {
      deleteSheetAction(formData);
    });
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">
          {STATUS_LABELS[sheet.status]}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          className="text-xs font-medium text-ink-faint transition-colors hover:text-accent"
        >
          Excluir
        </button>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={handleRename}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className="-mx-1 w-full rounded-md border border-transparent bg-transparent px-1 font-display text-lg font-semibold text-ink transition-colors focus:border-ink/15 focus:bg-canvas focus:outline-none"
      />

      <p className="text-xs text-ink-faint">Atualizada em {formatDate(sheet.updated_at)}</p>

      <Link href={`/sheets/${sheet.id}`} className={cn(buttonStyles("outline", "sm"), "mt-2 justify-center")}>
        Abrir
      </Link>
    </Card>
  );
}
