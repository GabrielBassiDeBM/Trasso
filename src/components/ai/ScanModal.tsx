"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import type { QuestionContent } from "@/lib/types/question";
import { Button } from "@/components/ui/Button";
import { AiReviewPanel } from "./AiReviewPanel";

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (questions: QuestionContent[]) => void;
}

export function ScanModal({ open, onClose, onAccept }: ScanModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<QuestionContent[]>([]);
  const [showReview, setShowReview] = useState(false);

  function reset() {
    setPreview(null);
    setError(null);
    setScanned([]);
    setShowReview(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError(null);
  }

  async function handleScan() {
    if (!preview) return;

    setLoading(true);
    setError(null);

    const base64 = preview.split(",")[1];
    const res = await fetch("/api/ai/scan-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileBase64: base64, mimeType }),
    });

    const data = await res.json() as { questions?: QuestionContent[]; error?: string };
    setLoading(false);

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to scan questions.");
      return;
    }

    if (data.questions && data.questions.length > 0) {
      setScanned(data.questions);
      setShowReview(true);
    } else {
      setError("No questions found in the image.");
    }
  }

  if (!open) return null;

  if (showReview) {
    return (
      <AiReviewPanel
        open
        title={`${scanned.length} question${scanned.length !== 1 ? "s" : ""} extracted`}
        questions={scanned}
        loading={loading}
        onAccept={(qs) => { onAccept(qs); handleClose(); }}
        onAcceptOne={(q) => { onAccept([q]); handleClose(); }}
        onRegenerate={handleScan}
        onClose={() => setShowReview(false)}
      />
    );
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={handleClose}
    >
      <div
        className="modal-content w-full max-w-[480px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-title"
      >
        <div className="h-2 btn-gradient" />
        <div className="p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 id="scan-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              Import questions from photo
            </h2>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft hover:bg-muted-strong"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-ink-soft">
            Take a photo or upload an image of printed questions. AI extracts <strong>all</strong> questions found automatically — text, type, and answer choices.
          </p>

          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="max-h-64 w-full object-contain bg-canvas" />
              <button
                onClick={reset}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-canvas py-12 text-ink-soft transition-colors hover:border-brand/40 hover:bg-brand-soft/30"
            >
              <Camera size={28} className="text-ink-faint" />
              <span className="text-sm font-medium">Click to select a photo</span>
              <span className="text-xs text-ink-faint">PNG, JPG, HEIC — up to 5 MB</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileSelect}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            {!preview ? (
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} />
                Select file
              </Button>
            ) : (
              <Button type="button" variant="primary" size="sm" onClick={handleScan} disabled={loading}>
                {loading ? "Analyzing…" : "Extract all questions"}
                {!loading && <Camera size={14} />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
