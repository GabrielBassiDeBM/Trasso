/**
 * Scannable answer card (cartão-resposta) for OMR grading.
 * High-contrast bubble grid with corner fiducials and version ID.
 * Designed to print at A4 scale reliably.
 */

import { cn } from "@/lib/utils/cn";

interface AnswerCardProps {
  variantLabel: string;
  questionCount: number;
  optionsPerQuestion?: number;
  studentName?: string;
  registryNo?: string;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

export function AnswerCard({
  variantLabel,
  questionCount,
  optionsPerQuestion = 5,
  studentName,
  registryNo,
}: AnswerCardProps) {
  const keys = OPTION_KEYS.slice(0, optionsPerQuestion);

  return (
    <div
      className="answer-card relative bg-white font-mono"
      style={{
        width: "180mm",
        minHeight: "120mm",
        padding: "8mm",
        border: "1px solid #000",
        pageBreakInside: "avoid",
      }}
    >
      {/* Corner fiducials (4 squares for OMR alignment) */}
      {[
        "absolute top-2 left-2",
        "absolute top-2 right-2",
        "absolute bottom-2 left-2",
        "absolute bottom-2 right-2",
      ].map((pos, i) => (
        <div
          key={i}
          className={cn(pos, "h-5 w-5 bg-black")}
          aria-hidden="true"
        />
      ))}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between px-6">
        <div className="text-[10pt] leading-tight">
          <p className="font-bold text-[12pt]">ANSWER CARD</p>
          <p className="mt-0.5">
            <span className="font-bold">Version: </span>
            <span className="inline-block min-w-[20mm] border-b border-black font-bold text-[14pt]">
              {variantLabel}
            </span>
          </p>
        </div>
        <div className="space-y-1 text-[9pt]">
          <div>
            <span className="font-bold">Nome: </span>
            <span className="inline-block min-w-[60mm] border-b border-black">
              {studentName ?? ""}
            </span>
          </div>
          <div>
            <span className="font-bold">ID / Registry: </span>
            <span className="inline-block min-w-[30mm] border-b border-black">
              {registryNo ?? ""}
            </span>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="px-6">
        <div className="mb-1 grid items-center" style={{ gridTemplateColumns: `18mm repeat(${keys.length}, 10mm)` }}>
          <span className="text-[8pt] font-bold">Question</span>
          {keys.map((k) => (
            <span key={k} className="text-center text-[9pt] font-bold">{k}</span>
          ))}
        </div>

        {/* Bubble rows */}
        <div className="columns-2 gap-4">
          {Array.from({ length: questionCount }, (_, i) => (
            <div
              key={i}
              className="mb-1 grid items-center break-inside-avoid"
              style={{ gridTemplateColumns: `18mm repeat(${keys.length}, 10mm)` }}
            >
              <span className="text-[9pt] font-semibold">{i + 1}.</span>
              {keys.map((k) => (
                <div
                  key={k}
                  className="mx-auto h-6 w-6 rounded-full border-2 border-black"
                  aria-label={`Question ${i + 1} option ${k}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 px-6 text-center text-[7pt] text-gray-500">
        Fill in circles completely with a blue or black pen. Do not use correction fluid.
      </div>
    </div>
  );
}
