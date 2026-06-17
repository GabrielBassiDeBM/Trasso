"use client";

import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ExamResult {
  id: string;
  student_name: string | null;
  registry_no: string | null;
  score: number | null;
  answers: Record<string, unknown> | null;
  per_question: Record<string, unknown> | null;
  graded_at: string;
}

interface ResultsTableProps {
  results: ExamResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const scores = results.map((r) => r.score ?? 0);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Average" value={avg.toFixed(1)} />
        <StatCard label="High score" value={String(max)} tintBg="bg-subject-green-soft" tintText="text-success" />
        <StatCard label="Low score" value={String(min)} tintBg="bg-danger-soft" tintText="text-danger" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-canvas border-b border-line">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">ID / Registry</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-canvas">
                <td className="px-4 py-3 font-medium text-ink">{r.student_name ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{r.registry_no ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "font-semibold",
                    (r.score ?? 0) >= 7 ? "text-success" : (r.score ?? 0) >= 5 ? "text-ink" : "text-danger"
                  )}>
                    {r.score ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft text-xs">
                  {new Date(r.graded_at).toLocaleDateString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, tintBg = "bg-brand-soft", tintText = "text-brand" }: {
  label: string; value: string; tintBg?: string; tintText?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tintBg)}>
          <BarChart2 size={14} className={tintText} />
        </span>
        <span className="text-xs font-semibold text-ink-soft">{label}</span>
      </div>
      <span className="font-mono text-2xl font-semibold text-ink">{value}</span>
    </div>
  );
}
