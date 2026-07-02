"use client";

import { useDeferredValue, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Latex } from "@/components/math/Latex";
import { MathFieldInput } from "@/components/math/MathFieldInput";
import { uploadQuestionImageAction } from "@/lib/actions/sheets";

interface StatementEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  label?: string;
  inlineImages?: string[];
  onImagesChange?: (images: string[]) => void;
}

export function StatementEditor({
  value,
  onChange,
  rows = 3,
  placeholder,
  label = "Statement",
  inlineImages = [],
  onImagesChange,
}: StatementEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMath, setShowMath] = useState(false);
  const [mathValues, setMathValues] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previewValue = useDeferredValue(value);

  function addEquationField() {
    setMathValues((values) => [...values, ""]);
  }

  function updateEquationField(index: number, latex: string) {
    setMathValues((values) => values.map((v, i) => (i === index ? latex : v)));
  }

  function removeEquationField(index: number) {
    setMathValues((values) => (values.length > 1 ? values.filter((_, i) => i !== index) : [""]));
  }

  function insertMath() {
    const snippet = mathValues
      .map((v) => v.trim())
      .filter(Boolean)
      .map((latex) => `$${latex}$`)
      .join(" ");
    if (!snippet) return;
    const textarea = textareaRef.current;

    if (!textarea) {
      onChange(value + snippet);
    } else {
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      onChange(value.slice(0, start) + snippet + value.slice(end));
      requestAnimationFrame(() => {
        const cursor = start + snippet.length;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    }

    setMathValues([""]);
    setShowMath(false);
  }

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
      onImagesChange?.([...inlineImages, result.url]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(url: string) {
    onImagesChange?.(inlineImages.filter((img) => img !== url));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        <div className="flex items-center gap-1">
          {onImagesChange && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Insert image"
            >
              <ImagePlus size={14} />
              {uploading ? "Uploading…" : "Image"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showMath) {
                setMathValues([""]);
              }
              setShowMath((open) => !open);
            }}
          >
            {showMath ? "Close equation" : "Insert equation"}
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

      {uploadError && (
        <p className="text-xs text-danger">{uploadError}</p>
      )}

      {inlineImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {inlineImages.map((url) => (
            <div key={url} className="group relative inline-block rounded-lg overflow-hidden border border-line">
              <Image
                src={url}
                alt="Question image"
                width={120}
                height={80}
                className="h-20 w-auto object-cover"
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

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
      />

      {showMath && (
        <div className="rounded-lg border border-line bg-canvas p-3 space-y-2">
          {mathValues.map((latex, index) => (
            <div key={index} className="flex items-center gap-2">
              <MathFieldInput value={latex} onChange={(v) => updateEquationField(index, v)} className="w-full" />
              <button
                type="button"
                onClick={() => removeEquationField(index)}
                className="shrink-0 rounded-md p-1 text-ink-faint hover:bg-muted hover:text-danger"
                aria-label="Remove equation"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={addEquationField} className="gap-1">
              <Plus size={14} />
              Add equation
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowMath(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={insertMath}
                disabled={!mathValues.some((v) => v.trim())}
              >
                Insert into statement
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewValue.trim() && (
        <div className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          <Latex text={previewValue} />
        </div>
      )}
    </div>
  );
}
