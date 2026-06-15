"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { SheetRow } from "@/lib/data/sheets";
import type { CoverLayout, PageSettings } from "@/lib/sheets/defaults";
import { renameSheetAction, updateCoverLayoutAction } from "@/lib/actions/sheets";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoverDesigner } from "./CoverDesigner";
import { PageSettingsPanel } from "./PageSettingsPanel";
import { QuestionList, type QuestionItem } from "./QuestionList";
import { SheetDocument } from "./SheetDocument";

interface SheetEditorProps {
  sheet: SheetRow;
  initialItems: QuestionItem[];
  initialPageSettings: PageSettings;
  coverLayout: CoverLayout;
}

export function SheetEditor({ sheet, initialItems, initialPageSettings, coverLayout: initialCoverLayout }: SheetEditorProps) {
  const [title, setTitle] = useState(sheet.title);
  const [items, setItems] = useState<QuestionItem[]>(initialItems);
  const [pageSettings, setPageSettings] = useState<PageSettings>(initialPageSettings);
  const [coverLayout, setCoverLayout] = useState<CoverLayout>(initialCoverLayout);
  const [, startTransition] = useTransition();

  const coverSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstCoverSave = useRef(true);

  useEffect(() => {
    if (skipFirstCoverSave.current) {
      skipFirstCoverSave.current = false;
      return;
    }

    if (coverSaveTimer.current) clearTimeout(coverSaveTimer.current);
    coverSaveTimer.current = setTimeout(() => {
      updateCoverLayoutAction(sheet.id, coverLayout);
    }, 500);

    return () => {
      if (coverSaveTimer.current) clearTimeout(coverSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLayout]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href="/dashboard" className="text-xs font-medium text-ink-faint transition-colors hover:text-ink">
            ← Minhas listas
          </Link>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={handleRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="-mx-1 mt-1 block w-full rounded-md border border-transparent bg-transparent px-1 font-display text-2xl font-semibold text-ink transition-colors focus:border-ink/15 focus:bg-canvas focus:outline-none sm:text-3xl"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <a href={`/sheets/${sheet.id}/print`} target="_blank" rel="noreferrer" className={buttonStyles("outline", "sm")}>
            Imprimir prova
          </a>
          <a href={`/sheets/${sheet.id}/print/gabarito`} target="_blank" rel="noreferrer" className={buttonStyles("outline", "sm")}>
            Imprimir gabarito
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_440px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Capa</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Arraste, redimensione e edite os blocos da primeira página: título, campos do aluno, instruções, nota
                e logo.
              </p>
            </div>
            <CoverDesigner title={title} layout={coverLayout} onChange={setCoverLayout} />
          </Card>
          <PageSettingsPanel sheetId={sheet.id} settings={pageSettings} onChange={setPageSettings} />
          <QuestionList sheetId={sheet.id} items={items} onItemsChange={setItems} />
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Pré-visualização</p>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-canvas p-4">
            <div style={{ zoom: 0.5 }}>
              <SheetDocument title={title} pageSettings={pageSettings} coverLayout={coverLayout} items={items} mode="preview" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
