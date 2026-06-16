"use client";

import { useState } from "react";
import { Camera, Download } from "lucide-react";
import type { SheetRow } from "@/lib/data/sheets";
import { OmrUploader } from "./OmrUploader";
import { ResultsTable } from "./ResultsTable";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

interface GradingDashboardProps {
  sheets: SheetRow[];
}

export function GradingDashboard({ sheets }: GradingDashboardProps) {
  const [selectedSheet, setSelectedSheet] = useState<SheetRow | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [results, setResults] = useState<ExamResult[]>([]);

  interface ExamResult {
    id: string;
    student_name: string | null;
    registry_no: string | null;
    score: number | null;
    answers: Record<string, unknown> | null;
    per_question: Record<string, unknown> | null;
    graded_at: string;
  }

  function handleResultAdded(result: ExamResult) {
    setResults((prev) => [result, ...prev]);
    setScanOpen(false);
  }

  function exportCsv() {
    if (results.length === 0) return;
    const headers = ["Name", "ID", "Score", "Date"];
    const rows = results.map((r) => [
      r.student_name ?? "",
      r.registry_no ?? "",
      String(r.score ?? ""),
      new Date(r.graded_at).toLocaleDateString("en-US"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results-${selectedSheet?.title ?? "sheet"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/95 px-8 py-4 backdrop-blur-[8px]">
        <h1 className="text-[20px] font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
          Auto-Grading
        </h1>
      </header>

      <div className="flex-1 px-8 py-7 space-y-7">
        {/* Sheet selector */}
        <div className="space-y-2 max-w-md">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Select sheet
          </label>
          <Select
            value={selectedSheet?.id ?? ""}
            onChange={(e) => {
              const s = sheets.find((sh) => sh.id === e.target.value) ?? null;
              setSelectedSheet(s);
              setResults([]);
            }}
          >
            <option value="">Choose a sheet…</option>
            {sheets.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </Select>
        </div>

        {selectedSheet && (
          <>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setScanOpen(true)}
              >
                <Camera size={14} />
                Scan answer card
              </Button>
              {results.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                >
                  <Download size={14} />
                  Export CSV
                </Button>
              )}
            </div>

            {results.length > 0 ? (
              <ResultsTable results={results} sheet={selectedSheet} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
                <Camera size={28} className="mb-3 text-ink-faint" />
                <p className="font-semibold text-ink">No results yet</p>
                <p className="mt-1 max-w-xs text-sm text-ink-soft">
                  Scan filled answer cards to start grading automatically.
                </p>
              </div>
            )}
          </>
        )}

        {!selectedSheet && (
          <div className="rounded-2xl border border-line bg-brand-soft/30 p-6 max-w-lg">
            <h2 className="font-semibold text-ink mb-2">How it works</h2>
            <ol className="space-y-2 text-sm text-ink-soft list-decimal list-inside">
              <li>Generate variants with answer cards in the sheet editor</li>
              <li>Print and administer the test with the answer cards</li>
              <li>Come back here, select the sheet, and scan the filled cards</li>
              <li>The system detects marked bubbles and calculates scores automatically</li>
            </ol>
          </div>
        )}
      </div>

      {selectedSheet && (
        <OmrUploader
          open={scanOpen}
          sheetId={selectedSheet.id}
          onClose={() => setScanOpen(false)}
          onResult={handleResultAdded}
        />
      )}
    </div>
  );
}
