"use client";

import { useState } from "react";
import { X, Shuffle } from "lucide-react";
import { createVariantsAction } from "@/lib/actions/variants";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

interface VariantsModalProps {
  sheetId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (variantIds: string[]) => void;
}

export function VariantsModal({ sheetId, open, onClose, onCreated }: VariantsModalProps) {
  const [count, setCount] = useState(2);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const result = await createVariantsAction(sheetId, count, shuffleOptions);
    setCreating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onCreated(result.variantIds);
    onClose();
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-[440px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variants-title"
      >
        <div className="h-2 btn-gradient" />
        <div className="p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 id="variants-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              Generate versions
            </h2>
            <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft hover:bg-muted-strong">
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-ink-soft">
            Each version shuffles the question order (and answer choices, if enabled). The answer key is automatically recalculated for each version.
          </p>

          <div>
            <Label htmlFor="variants-count">Number of versions</Label>
            <Input
              id="variants-count"
              type="number"
              min={1}
              max={6}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(6, Number(e.target.value))))}
            />
            <p className="mt-1 text-xs text-ink-faint">Max 6 versions (A–F)</p>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-brand"
            />
            <span className="text-sm text-ink">Shuffle answer choices (MCQ)</span>
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className={buttonStyles("ghost", "sm")}>Cancel</button>
            <Button type="button" variant="primary" size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? "Generating…" : "Generate versions"}
              {!creating && <Shuffle size={14} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
