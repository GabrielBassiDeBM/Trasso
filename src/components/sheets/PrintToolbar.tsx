"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

interface PrintToolbarProps {
  sheetId: string;
  title: string;
  altHref: string;
  altLabel: string;
}

export function PrintToolbar({ sheetId, title, altHref, altLabel }: PrintToolbarProps) {
  return (
    <div
      className="mx-auto mb-6 flex w-[210mm] max-w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3 shadow-sm print:hidden"
    >
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <Link href={`/sheets/${sheetId}`} className="text-xs text-ink-faint transition-colors hover:text-ink">
          ← Back to editor
        </Link>
      </div>
      <div className="flex gap-2">
        <Link href={altHref} className={buttonStyles("outline", "sm")}>
          {altLabel}
        </Link>
        <button type="button" onClick={() => window.print()} className={buttonStyles("primary", "sm")}>
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
