"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchableMultiSelectOption {
  id: string;
  label: string;
}

interface Props {
  options: SearchableMultiSelectOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResultsLabel: string;
  clearLabel: string;
  disabled?: boolean;
  disabledHint?: string;
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsLabel,
  clearLabel,
  disabled,
  disabledHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o.id)),
    [options, selectedSet],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(id: string) {
    onChange(selectedSet.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  if (disabled) {
    return <p className="mt-1.5 text-xs text-ink-faint">{disabledHint}</p>;
  }

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-left text-sm shadow-xs transition-all duration-150 hover:border-brand/40",
          open && "border-brand ring-2 ring-brand/25",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-ink-faint">{placeholder}</span>
          ) : (
            selectedOptions.map((o) => (
              <span
                key={o.id}
                className="inline-flex items-center gap-1 rounded-full border border-brand bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand"
              >
                {o.label}
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 text-ink-faint">
          {selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={clear}
              aria-label={clearLabel}
              className="rounded-full p-0.5 hover:bg-[#f1f0f5] hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={15} className={cn("transition-transform", open && "rotate-180")} />
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          <div className="relative border-b border-line">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent px-9 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-ink-faint">{noResultsLabel}</p>
            ) : (
              filtered.map((o) => {
                const active = selectedSet.has(o.id);
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => toggle(o.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      active ? "bg-brand-soft text-brand" : "text-ink hover:bg-[#f6f5fa]",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <Check size={14} strokeWidth={3} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
