"use client";

import { useDeferredValue, useRef, useState } from "react";
import Image from "next/image";
import { BookText, ImagePlus, X } from "lucide-react";
import type { QuestionContent } from "@/lib/types/question";
import { uploadQuestionImageAction } from "@/lib/actions/sheets";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Latex } from "@/components/math/Latex";

interface QuestionExtrasEditorProps {
  content: QuestionContent;
  onChange: (content: QuestionContent) => void;
}

/**
 * Optional stimulus material shared by every question type: a reading passage
 * shown before the statement and images shown after it.
 */
export function QuestionExtrasEditor({ content, onChange }: QuestionExtrasEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassage, setShowPassage] = useState(Boolean(content.passage));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const images = content.images ?? [];
  const previewPassage = useDeferredValue(content.passage ?? "");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadQuestionImageAction(fd);

    setUploading(false);

    if ("error" in result) {
      setUploadError(result.error);
    } else {
      onChange({ ...content, images: [...images, result.url] });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(url: string) {
    onChange({ ...content, images: images.filter((img) => img !== url) });
  }

  return (
    <div className="space-y-2 border-t border-line pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Passage &amp; images (optional)
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showPassage && content.passage) onChange({ ...content, passage: "" });
              setShowPassage((open) => !open);
            }}
          >
            <BookText size={14} />
            {showPassage ? "Remove passage" : "Add passage"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus size={14} />
            {uploading ? "Uploading…" : "Add image"}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleImageUpload}
        aria-hidden="true"
      />

      {uploadError && <p className="text-xs text-danger">{uploadError}</p>}

      {showPassage && (
        <div className="space-y-1.5">
          <Textarea
            value={content.passage ?? ""}
            onChange={(event) => onChange({ ...content, passage: event.target.value })}
            rows={4}
            placeholder="Reading passage or context shown before this question…"
          />
          {previewPassage.trim() && (
            <div className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
              <Latex text={previewPassage} />
            </div>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="group relative inline-block overflow-hidden rounded-lg border border-line">
              <Image
                src={url}
                alt="Question image"
                width={160}
                height={100}
                className="h-24 w-auto object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
