"use client";

import { useActionState, useEffect, useState } from "react";
import { X, ArrowRight, Wand2, Camera, FileText } from "lucide-react";
import { createSheetAction, type SheetActionState } from "@/lib/actions/sheets";
import { Input, Label, Select } from "@/components/ui/Input";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
}

type CreationMode = "blank" | "ai_generate" | "scan";

const EXAM_TYPES = [
  { value: "", label: "Select…" },
  { value: "prova", label: "Test / Exam" },
  { value: "lista", label: "Problem Set" },
  { value: "simulado", label: "Practice Test" },
  { value: "recuperacao", label: "Review" },
] as const;

const GRADE_OPTIONS = [
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const MODES = [
  { id: "blank" as CreationMode, label: "Blank", icon: FileText, description: "Start from scratch" },
  { id: "ai_generate" as CreationMode, label: "Generate with AI", icon: Wand2, description: "AI writes the questions" },
  { id: "scan" as CreationMode, label: "Scan a photo", icon: Camera, description: "Import from a photo" },
];

const initial: SheetActionState = { error: null };

export function NewSheetModal({ open, onClose }: Props) {
  const [state, formAction, pending] = useActionState(createSheetAction, initial);
  const [mode, setMode] = useState<CreationMode>("blank");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => { if (open) setMode("blank"); }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-[520px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="h-2 btn-gradient" />

        <div className="p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="modal-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              New Sheet
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f0f5] text-ink-soft transition-colors hover:bg-[#e3e1ea] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode selector */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                  mode === m.id
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-canvas text-ink-soft hover:border-brand/40 hover:bg-brand-soft/50"
                )}
              >
                <m.icon size={18} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[10px] text-ink-faint">{m.description}</span>
              </button>
            ))}
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="mode" value={mode} />

            <div>
              <Label htmlFor="modal-title-input">Title</Label>
              <Input
                id="modal-title-input"
                name="title"
                placeholder="e.g. AP Calculus BC — Unit 5 Test"
                autoFocus
                required
              />
            </div>

            <div>
              <Label htmlFor="modal-exam-type">Type</Label>
              <Select id="modal-exam-type" name="exam_type">
                {EXAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modal-grade">Grade Level</Label>
                <Select id="modal-grade" name="grade_level">
                  <option value="">Select…</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="modal-turma">Period / Class</Label>
                <Input id="modal-turma" name="turma" placeholder="e.g. Period 3, Block A" />
              </div>
            </div>

            {/* AI mode extra fields */}
            {mode === "ai_generate" && (
              <div className="rounded-xl border border-brand/30 bg-brand-soft/60 p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                  <Wand2 size={13} />
                  AI Configuration
                </div>
                <div>
                  <Label htmlFor="modal-ai-topic">Topic</Label>
                  <Input id="modal-ai-topic" name="ai_topic" placeholder="e.g. Derivatives, Electrostatics, Cell Biology…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="modal-ai-count">No. of questions</Label>
                    <Input id="modal-ai-count" name="ai_count" type="number" min={1} max={20} defaultValue={5} />
                  </div>
                  <div>
                    <Label htmlFor="modal-ai-difficulty">Difficulty</Label>
                    <Select id="modal-ai-difficulty" name="ai_difficulty">
                      {DIFFICULTY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {mode === "scan" && (
              <div className="rounded-xl border border-accent/30 bg-accent-soft/60 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1187f0]">
                  <Camera size={13} />
                  Import from photo
                </div>
                <p className="text-xs text-ink-soft">
                  After creating the sheet, you can take or upload photos of existing questions. The editor will open in scan mode automatically.
                </p>
              </div>
            )}

            {state.error && (
              <p role="alert" className="text-sm text-danger">{state.error}</p>
            )}

            <div className="mt-1 flex justify-end gap-3">
              <button type="button" onClick={onClose} className={buttonStyles("ghost", "sm")}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={buttonStyles("primary", "sm")}>
                {pending ? "Creating…" : mode === "ai_generate" ? "Create and generate" : "Create and edit"}
                {!pending && <ArrowRight size={15} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
