"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface Props {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResultsLabel: string;
}

export function SearchableSelect({ options, value, onChange, placeholder, searchPlaceholder, noResultsLabel }: Props) {
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

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function select(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
    setQuery("");
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
          "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 text-left text-sm shadow-xs transition-all duration-150 hover:border-brand/40",
          open && "border-brand ring-2 ring-brand/25",
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-ink-faint")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={15} className={cn("shrink-0 text-ink-faint transition-transform", open && "rotate-180")} />
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
                const active = o.value === value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => select(o.value)}
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
