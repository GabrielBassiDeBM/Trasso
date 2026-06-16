"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { renameSheetAction, deleteSheetAction } from "@/lib/actions/sheets";
import { cn } from "@/lib/utils/cn";
import type { SheetRow } from "@/lib/data/sheets";

const COVERS = [
  "linear-gradient(120deg,#a71efb,#7311b3)",
  "linear-gradient(120deg,#29a1ff,#0a6ccc)",
  "linear-gradient(120deg,#a71efb,#29a1ff)",
  "linear-gradient(120deg,#8f12e0,#29a1ff)",
  "linear-gradient(120deg,#561286,#a71efb)",
  "linear-gradient(120deg,#1187f0,#71bfff)",
];

const STATUS_LABELS: Record<SheetRow["status"], string> = {
  draft: "Draft",
  ready: "Ready",
};

const STATUS_STYLES: Record<SheetRow["status"], string> = {
  draft: "bg-[#fdf3e3] text-[#e0890b]",
  ready: "bg-[#e9f8ef] text-[#16a34a]",
};

function formatDate(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

export function SheetCard({ sheet, index }: { sheet: SheetRow; index: number }) {
  const [title, setTitle] = useState(sheet.title);
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const cover = COVERS[index % COVERS.length];

  function handleRename() {
    setEditing(false);
    const trimmed = title.trim();
    if (!trimmed || trimmed === sheet.title) { setTitle(sheet.title); return; }
    const fd = new FormData();
    fd.set("id", sheet.id);
    fd.set("title", trimmed);
    startTransition(() => renameSheetAction(fd));
  }

  function handleDelete() {
    if (!confirm(`Delete "${sheet.title}"? This cannot be undone.`)) return;
    const fd = new FormData();
    fd.set("id", sheet.id);
    startTransition(() => deleteSheetAction(fd));
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      {/* Gradient cover */}
      <Link
        href={`/sheets/${sheet.id}`}
        className="flex h-24 items-start justify-between p-4"
        style={{ background: cover }}
        tabIndex={-1}
      >
        <span className="rounded-full bg-white/20 px-2.5 py-1 font-mono text-[11px] font-semibold text-white/90">
          {STATUS_LABELS[sheet.status]}
        </span>
        <FileText size={26} className="text-white/90" />
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLES[sheet.status])}>
          {STATUS_LABELS[sheet.status]}
        </span>

        {/* Title — editable */}
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setTitle(sheet.title); setEditing(false); } }}
            className="w-full rounded-lg border border-brand bg-canvas px-2 py-1 text-[15px] font-bold text-ink focus:outline-none"
          />
        ) : (
          <Link href={`/sheets/${sheet.id}`} className="block text-[15px] font-bold leading-snug text-ink hover:text-brand" style={{ letterSpacing: "-0.01em" }}>
            {title}
          </Link>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[12px] text-ink-faint">Edited {formatDate(sheet.updated_at)}</span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setEditing(true)}
              aria-label="Rename sheet"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-[#f1f0f5] hover:text-ink"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete sheet"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-[#fdecee] hover:text-danger"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
