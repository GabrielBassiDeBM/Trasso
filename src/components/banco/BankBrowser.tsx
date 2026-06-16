"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal, Globe, BookOpen } from "lucide-react";
import type { SubjectRow, TopicRow } from "@/lib/data/sheets";
import { QUESTION_TYPE_LABELS, QUESTION_TYPES } from "@/lib/types/question";
import { BankQuestionCard } from "./BankQuestionCard";
import { Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

type QuestionWithTaxonomy = {
  id: string;
  statement: string;
  type: string;
  difficulty: string | null;
  tags: string[];
  is_adapted: boolean;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; name: string } | null;
  owner_id: string | null;
};

interface BankBrowserProps {
  questions: QuestionWithTaxonomy[];
  subjects: SubjectRow[];
  topics: TopicRow[];
  activeTab: "public" | "personal";
  filters: {
    q: string;
    subject: string;
    topic: string;
    type: string;
    difficulty: string;
    adapted: string;
  };
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function BankBrowser({ questions, subjects, topics, activeTab, filters }: BankBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key === "subject") params.delete("topic");
      router.push(`/banco?${params.toString()}`);
    },
    [router, searchParams],
  );

  function switchTab(tab: "public" | "personal") {
    const params = new URLSearchParams();
    if (tab !== "public") params.set("tab", tab);
    router.push(`/banco?${params.toString()}`);
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/95 px-8 py-4 backdrop-blur-[8px]">
        <h1 className="text-[20px] font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
          Question Bank
        </h1>
        <div className="relative ml-auto w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            defaultValue={filters.q}
            placeholder="Search questions…"
            aria-label="Search questions"
            className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 hover:border-brand/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") update("q", e.currentTarget.value);
            }}
            onBlur={(e) => update("q", e.currentTarget.value)}
          />
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-line bg-surface px-8 py-2">
        <button
          onClick={() => switchTab("public")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "public"
              ? "bg-brand-soft text-brand"
              : "text-ink-soft hover:bg-[#f1f0f5] hover:text-ink"
          )}
        >
          <Globe size={14} aria-hidden="true" />
          Public Bank
        </button>
        <button
          onClick={() => switchTab("personal")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "personal"
              ? "bg-brand-soft text-brand"
              : "text-ink-soft hover:bg-[#f1f0f5] hover:text-ink"
          )}
        >
          <BookOpen size={14} aria-hidden="true" />
          My Questions
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar filters */}
        <aside className="w-60 shrink-0 border-r border-line bg-surface px-4 py-5 space-y-5 overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <SlidersHorizontal size={13} />
            Filters
          </div>

          <FilterSection label="Subject">
            <Select
              value={filters.subject}
              onChange={(e) => update("subject", e.target.value)}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FilterSection>

          {topics.length > 0 && (
            <FilterSection label="Topic">
              <Select
                value={filters.topic}
                onChange={(e) => update("topic", e.target.value)}
              >
                <option value="">All topics</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </FilterSection>
          )}

          <FilterSection label="Question type">
            <Select
              value={filters.type}
              onChange={(e) => update("type", e.target.value)}
            >
              <option value="">All types</option>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
              ))}
            </Select>
          </FilterSection>

          <FilterSection label="Difficulty">
            <Select
              value={filters.difficulty}
              onChange={(e) => update("difficulty", e.target.value)}
            >
              <option value="">All levels</option>
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FilterSection>

          <FilterSection label="">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={filters.adapted === "1"}
                onChange={(e) => update("adapted", e.target.checked ? "1" : "")}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              Adapted only (accessibility)
            </label>
          </FilterSection>
        </aside>

        {/* Question grid */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === "public" && questions.length === 0 && !filters.q && !filters.subject && !filters.type && !filters.difficulty ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Globe size={32} className="mb-3 text-ink-faint" aria-hidden="true" />
              <p className="font-semibold text-ink">Public bank coming soon</p>
              <p className="mt-1 max-w-xs text-sm text-ink-soft">
                Curated SAT/AP questions will appear here. Use &quot;My Questions&quot; to browse questions from your own sheets.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-soft">
                {questions.length === 0
                  ? "No questions found."
                  : `${questions.length} question${questions.length !== 1 ? "s" : ""}`}
              </p>
              <div className="space-y-3">
                {questions.map((q) => (
                  <BankQuestionCard key={q.id} question={q} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs font-semibold text-ink-soft">{label}</p>
      )}
      {children}
    </div>
  );
}
