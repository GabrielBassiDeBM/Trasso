"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo, useCallback, useTransition } from "react";
import {
  Search, SlidersHorizontal, Globe, BookOpen, X,
  BarChart2, Zap, FlaskConical, Leaf, Code2, TreePine, Plus,
  LayoutList, LayoutGrid, Columns3, Trash2, Check, ChevronDown,
  // subject icons
  Atom, Dna, Sigma, Infinity, TrendingUp, Binary, Globe2, Cpu, BookText, Spline,
  // topic icons
  GitBranch, GitFork, Repeat, Shuffle, Scale, Move, Weight,
  Orbit, Waves, Magnet, Thermometer, Droplets, Wind, Eye,
  Divide, RefreshCw, Compass, Boxes, Box, Workflow, Network,
  Database, TestTube, Microscope, Users, Target,
  ArrowRight, Combine,
} from "lucide-react";
import type { SubjectRow, TopicRow } from "@/lib/data/sheets";
import { QUESTION_TYPES } from "@/lib/types/question";
import { BankQuestionCard } from "./BankQuestionCard";
import { cn } from "@/lib/utils/cn";
import { useT, useLocale } from "@/lib/i18n/client";
import { translateTopicName } from "@/lib/i18n/translations";
import { deleteManyFromBankAction, pullManyFromBankAction } from "@/lib/actions/questions";
import { AddToBankModal } from "./AddToBankModal";

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

interface LocalFilters {
  subjects: string[];
  topics: string[];
  types: string[];
  difficulties: string[];
  adapted: boolean;
}

interface BankBrowserProps {
  questions: QuestionWithTaxonomy[];
  subjects: SubjectRow[];
  allTopics: TopicRow[];
  sheets: Array<{ id: string; title: string }>;
  activeTab: "public" | "personal";
  filters: {
    q: string;
    subjects: string[];
    topics: string[];
    types: string[];
    difficulties: string[];
    adapted: string;
  };
}

export function getSubjectIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  // Exact overrides first — needed where two subjects would otherwise share
  // an icon under the generic keyword rules below (e.g. Calculus AB vs BC,
  // Physics 1 vs 2).
  if (n === "ap calculus ab") return Infinity;
  if (n === "ap calculus bc") return Spline;
  if (n === "ap physics 1") return Atom;
  if (n === "ap physics 2") return Waves;
  if (n.includes("reading") || n.includes("writing")) return BookText;
  if (n.includes("statistics")) return BarChart2;
  if (n.includes("precalculus")) return TrendingUp;
  if (n.includes("calculus")) return Infinity;
  if (n.includes("math")) return Sigma;
  if (n.includes("e&m") || n.includes("electromagnetic")) return Zap;
  if (n.includes("mechanics") && n.includes("physics")) return Move;
  if (n.includes("physics")) return Atom;
  if (n.includes("chemistry")) return FlaskConical;
  if (n.includes("biology")) return Dna;
  if (n.includes("computer science principles")) return Cpu;
  if (n.includes("computer")) return Binary;
  if (n.includes("environmental")) return Globe2;
  return BookOpen;
}

export function getSubjectColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("reading") || n.includes("writing")) return "text-subject-sky bg-subject-sky-soft";
  if (n.includes("statistics")) return "text-subject-violet bg-subject-violet-soft";
  if (n.includes("calculus") || n.includes("precalculus")) return "text-brand bg-brand-soft";
  if (n.includes("math")) return "text-brand bg-brand-soft";
  if (n.includes("physics")) return "text-subject-amber bg-subject-amber-soft";
  if (n.includes("chemistry")) return "text-subject-emerald bg-subject-emerald-soft";
  if (n.includes("biology")) return "text-subject-green bg-subject-green-soft";
  if (n.includes("computer")) return "text-subject-indigo bg-subject-indigo-soft";
  if (n.includes("environmental")) return "text-success bg-subject-green2-soft";
  return "text-accent-dark bg-accent-soft";
}

export function getSubjectGradient(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("reading") || n.includes("writing"))
    return "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)";
  if (n.includes("statistics"))
    return "linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)";
  if (n.includes("precalculus"))
    return "linear-gradient(135deg, #a71efb 0%, #7311b3 100%)";
  if (n.includes("calculus"))
    return "linear-gradient(135deg, #a71efb 0%, #29a1ff 100%)";
  if (n.includes("math"))
    return "linear-gradient(135deg, #a71efb 0%, #6d0fb8 100%)";
  if (n.includes("e&m") || n.includes("electromagnetic"))
    return "linear-gradient(135deg, #f97316 0%, #b45309 100%)";
  if (n.includes("physics"))
    return "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)";
  if (n.includes("chemistry"))
    return "linear-gradient(135deg, #10b981 0%, #065f46 100%)";
  if (n.includes("biology"))
    return "linear-gradient(135deg, #22c55e 0%, #15803d 100%)";
  if (n.includes("computer"))
    return "linear-gradient(135deg, #6366f1 0%, #3730a3 100%)";
  if (n.includes("environmental"))
    return "linear-gradient(135deg, #16a34a 0%, #14532d 100%)";
  return "linear-gradient(135deg, #68617d 0%, #3d3656 100%)";
}

export function getTopicIcon(name: string): React.ElementType | null {
  const n = name.toLowerCase();

  // Calculus / Precalculus
  if (n.includes("limit")) return Infinity;
  if (n.includes("differential equation")) return GitBranch;
  if (n.includes("differenti")) return TrendingUp;
  if (n.includes("integration") || n.includes("accumulation")) return Sigma;
  if (n.includes("sequence") || n.includes("series")) return Repeat;
  if (n.includes("parametric") || n.includes("polar") || (n.includes("vector") && !n.includes("field"))) return Compass;
  if (n.includes("trigonometric") || n.includes("trig")) return RefreshCw;
  if (n.includes("polynomial") || n.includes("rational")) return Divide;
  if (n.includes("exponential") || n.includes("logarithmic")) return TrendingUp;
  if (n.includes("matrix") || n.includes("matrices")) return Boxes;

  // Statistics / SAT Math
  if (n.includes("probability")) return Shuffle;
  if (n.includes("inference") || n.includes("chi-square")) return Scale;
  if (n.includes("sampling distribution")) return Database;
  if (n.includes("algebra")) return Sigma;
  if (n.includes("data analysis") || n.includes("exploring")) return BarChart2;

  // Physics — Mechanics
  if (n.includes("kinematic")) return Move;
  if (n.includes("newton") || n.includes("force")) return Weight;
  if (n.includes("work, energy") || n.includes("energy") && n.includes("power")) return Zap;
  if (n.includes("momentum") || n.includes("linear momentum")) return ArrowRight;
  if (n.includes("circular") || n.includes("rotation") || n.includes("torque")) return RefreshCw;
  if (n.includes("gravitation") || n.includes("orbit")) return Orbit;
  if (n.includes("oscillat") || n.includes("harmonic")) return Waves;
  if (n.includes("wave") || n.includes("sound")) return Waves;

  // Physics — E&M / Modern
  if (n.includes("electrostatic") || n.includes("electric force") || n.includes("electric charge")) return Zap;
  if (n.includes("magnet") || n.includes("electromagnetic induction")) return Magnet;
  if (n.includes("circuit")) return Zap;
  if (n.includes("optic") || n.includes("light")) return Eye;
  if (n.includes("quantum") || n.includes("nuclear") || n.includes("atomic")) return Atom;
  if (n.includes("thermodynamics") || n.includes("thermal")) return Thermometer;
  if (n.includes("fluid")) return Droplets;
  if (n.includes("capacitor") || n.includes("conductor") || n.includes("dielectric")) return Boxes;

  // Chemistry
  if (n.includes("atomic structure")) return Atom;
  if (n.includes("chemical reaction")) return FlaskConical;
  if (n.includes("kinetics")) return TrendingUp;
  if (n.includes("equilibrium")) return Scale;
  if (n.includes("acid") || n.includes("base")) return TestTube;
  if (n.includes("intermolecular") || n.includes("molecular") || n.includes("ionic")) return Combine;
  if (n.includes("thermodynamics") || n.includes("thermal")) return Thermometer;

  // Biology
  if (n.includes("heredity") || n.includes("gene expression") || n.includes("gene regulation")) return Dna;
  if (n.includes("cell structure") || n.includes("cell function")) return Microscope;
  if (n.includes("cell cycle") || n.includes("cell communication")) return RefreshCw;
  if (n.includes("energetics") || n.includes("photosynthesis")) return Leaf;
  if (n.includes("natural selection") || n.includes("evolution")) return Target;
  if (n.includes("ecology")) return TreePine;
  if (n.includes("chemistry of life")) return FlaskConical;
  if (n.includes("population")) return Users;

  // Computer Science
  if (n.includes("boolean") || n.includes("if statement")) return GitBranch;
  if (n.includes("iteration")) return Repeat;
  if (n.includes("recursion")) return RefreshCw;
  if (n.includes("arraylist") || n.includes("2d array")) return Boxes;
  if (n.includes("array")) return Box;
  if (n.includes("inheritance")) return GitFork;
  if (n.includes("writing class") || n.includes("using object")) return Code2;
  if (n.includes("algorithm") || n.includes("programming")) return Workflow;
  if (n.includes("network") || n.includes("internet") || n.includes("system")) return Network;
  if (n.includes("data")) return Database;
  if (n.includes("primitive")) return Binary;
  if (n.includes("impact") || n.includes("creative")) return Cpu;

  // Environmental
  if (n.includes("atmosphere") || n.includes("air pollution")) return Wind;
  if (n.includes("aquatic") || n.includes("water")) return Droplets;
  if (n.includes("global change") || n.includes("climate")) return Globe2;
  if (n.includes("energy resource") || n.includes("energy consumption")) return Zap;
  if (n.includes("ecosystem") || n.includes("biodiversity")) return TreePine;
  if (n.includes("population")) return Users;
  if (n.includes("earth system") || n.includes("land")) return Globe2;

  return null;
}

const DIFFICULTY_LEVELS = [
  { value: "easy", bars: 1, activeColor: "bg-success" },
  { value: "medium", bars: 2, activeColor: "bg-brand" },
  { value: "hard", bars: 3, activeColor: "bg-danger" },
] as const;

// ─── Sheet Picker ─────────────────────────────────────────────────────────────

interface SheetPickerProps {
  sheets: Array<{ id: string; title: string }>;
  onSelect: (sheetId: string) => void;
  onClose: () => void;
  working: boolean;
}

function SheetPicker({ sheets, onSelect, onClose, working }: SheetPickerProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => sheets.filter((s) => s.title.toLowerCase().includes(search.toLowerCase())),
    [sheets, search],
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[199]" onClick={onClose} aria-hidden="true" />
      {/* Dropdown */}
      <div className="absolute bottom-full right-0 z-[200] mb-2 w-72 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="border-b border-line p-2">
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("bank.selection.searchSheets")}
              className="h-8 w-full rounded-lg border border-line bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-ink-faint">
              {t("bank.selection.noSheets")}
            </p>
          ) : (
            filtered.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                disabled={working}
                onClick={() => onSelect(sheet.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-muted disabled:opacity-60"
              >
                <BookOpen size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />
                <span className="truncate">{sheet.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BankBrowser({ questions, subjects, allTopics, sheets, activeTab, filters }: BankBrowserProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [, startTransition] = useTransition();

  // Filter state
  const hasInitialFilters = !!(
    filters.subjects.length || filters.topics.length ||
    filters.types.length || filters.difficulties.length || filters.adapted
  );
  const [filtersOpen, setFiltersOpen] = useState(hasInitialFilters);
  const [cols, setCols] = useState<1 | 2 | 3>(1);
  const [local, setLocal] = useState<LocalFilters>({
    subjects: filters.subjects,
    topics: filters.topics,
    types: filters.types,
    difficulties: filters.difficulties,
    adapted: filters.adapted === "1",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sheetPickerOpen, setSheetPickerOpen] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);

  const inSelectionMode = selectedIds.size > 0;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function selectGroup(ids: string[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allIn = ids.every((id) => next.has(id));
      if (allIn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(questions.map((q) => q.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSheetPickerOpen(false);
  }

  async function handleBulkDelete() {
    const msg = t("bank.selection.deleteConfirm", { n: selectedIds.size } as Parameters<typeof t>[1]);
    if (!confirm(msg)) return;
    setBulkWorking(true);
    startTransition(async () => {
      await deleteManyFromBankAction([...selectedIds]);
      setBulkWorking(false);
      clearSelection();
    });
  }

  async function handleAddToSheet(sheetId: string) {
    setBulkWorking(true);
    await pullManyFromBankAction(sheetId, [...selectedIds]);
    setBulkWorking(false);
    clearSelection();
  }

  async function handleSingleAdd(questionId: string, sheetId: string) {
    await pullManyFromBankAction(sheetId, [questionId]);
  }

  // Filter helpers
  const visibleTopics = useMemo(
    () => local.subjects.length > 0
      ? allTopics.filter((tp) => local.subjects.includes(tp.subject_id))
      : [],
    [allTopics, local.subjects],
  );

  function buildUrl(state: LocalFilters, tab = activeTab, q = filters.q): string {
    const params = new URLSearchParams();
    if (tab !== "public") params.set("tab", tab);
    if (q) params.set("q", q);
    if (state.subjects.length) params.set("subjects", state.subjects.join(","));
    if (state.topics.length) params.set("topics", state.topics.join(","));
    if (state.types.length) params.set("types", state.types.join(","));
    if (state.difficulties.length) params.set("difficulties", state.difficulties.join(","));
    if (state.adapted) params.set("adapted", "1");
    return `/banco?${params.toString()}`;
  }

  function goNow(next: LocalFilters) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocal(next);
    router.push(buildUrl(next));
  }

  function goDebounced(next: LocalFilters) {
    setLocal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => router.push(buildUrl(next)), 380);
  }

  function toggleSubject(subjectId: string) {
    const subjects = local.subjects.includes(subjectId)
      ? local.subjects.filter((s) => s !== subjectId)
      : [...local.subjects, subjectId];
    const validTopics = local.topics.filter((topicId) =>
      allTopics.some((t) => t.id === topicId && subjects.includes(t.subject_id))
    );
    goNow({ ...local, subjects, topics: validTopics });
  }

  function toggleTopic(topicId: string) {
    const topics = local.topics.includes(topicId)
      ? local.topics.filter((t) => t !== topicId)
      : [...local.topics, topicId];
    goNow({ ...local, topics });
  }

  function toggleType(type: string) {
    const types = local.types.includes(type)
      ? local.types.filter((t) => t !== type)
      : [...local.types, type];
    goDebounced({ ...local, types });
  }

  function toggleDifficulty(diff: string) {
    const difficulties = local.difficulties.includes(diff)
      ? local.difficulties.filter((d) => d !== diff)
      : [...local.difficulties, diff];
    goDebounced({ ...local, difficulties });
  }

  function setAdapted(adapted: boolean) {
    goNow({ ...local, adapted });
  }

  function clearAll() {
    goNow({ subjects: [], topics: [], types: [], difficulties: [], adapted: false });
  }

  function switchTab(tab: "public" | "personal") {
    const blank = { subjects: [], topics: [], types: [], difficulties: [], adapted: false };
    setLocal(blank);
    clearSelection();
    router.push(buildUrl(blank, tab));
  }

  function handleSearch(value: string) {
    router.push(buildUrl(local, activeTab, value));
  }

  const activeFilterCount =
    local.subjects.length +
    local.topics.length +
    local.types.length +
    local.difficulties.length +
    (local.adapted ? 1 : 0);

  const groupedList = useMemo(() => {
    if (activeTab !== "personal") return null;
    const map = new Map<string, { key: string; name: string; qs: QuestionWithTaxonomy[] }>();
    for (const q of questions) {
      const key = q.subject?.id ?? "__none";
      const name = q.subject?.name ?? "—";
      if (!map.has(key)) map.set(key, { key, name, qs: [] });
      map.get(key)!.qs.push(q);
    }
    return Array.from(map.values());
  }, [questions, activeTab]);

  const allSelected = questions.length > 0 && questions.every((q) => selectedIds.has(q.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div className="flex min-h-full flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface/95 px-8 py-4 backdrop-blur-[8px]">
        <h1
          className="shrink-0 text-[20px] font-bold text-ink"
          style={{ letterSpacing: "-0.01em" }}
        >
          {t("bank.title")}
        </h1>

        {activeTab === "personal" && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-brand bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
          >
            <Plus size={13} />
            {t("bank.addQuestion")}
          </button>
        )}

        {/* Search */}
        <div className="relative ml-auto w-56">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            key={filters.q}
            defaultValue={filters.q}
            placeholder={t("bank.searchPlaceholder")}
            aria-label={t("bank.searchPlaceholder")}
            className="h-9 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-[border-color,box-shadow] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 hover:border-brand/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(e.currentTarget.value);
            }}
            onBlur={(e) => handleSearch(e.currentTarget.value)}
          />
        </div>

        {/* Layout toggle */}
        <div className="flex items-center gap-0.5 rounded-xl border border-line p-1">
          <button
            type="button"
            onClick={() => setCols(1)}
            title="Single column"
            aria-label="Single column layout"
            className={cn(
              "rounded-lg p-1.5 transition-colors duration-150",
              cols === 1 ? "bg-brand-soft text-brand" : "text-ink-soft hover:text-ink",
            )}
          >
            <LayoutList size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCols(2)}
            title="Two columns"
            aria-label="Two column layout"
            className={cn(
              "rounded-lg p-1.5 transition-colors duration-150",
              cols === 2 ? "bg-brand-soft text-brand" : "text-ink-soft hover:text-ink",
            )}
          >
            <LayoutGrid size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCols(3)}
            title="Three columns"
            aria-label="Three column layout"
            className={cn(
              "rounded-lg p-1.5 transition-colors duration-150",
              cols === 3 ? "bg-brand-soft text-brand" : "text-ink-soft hover:text-ink",
            )}
          >
            <Columns3 size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Filters toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
            filtersOpen || activeFilterCount > 0
              ? "border-brand bg-brand-soft text-brand"
              : "border-line text-ink-soft hover:border-brand/40 hover:text-ink",
          )}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          {t("bank.filters.label")}
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-line bg-surface px-8 py-2">
        <button
          type="button"
          onClick={() => switchTab("public")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "public"
              ? "bg-brand-soft text-brand"
              : "text-ink-soft hover:bg-muted hover:text-ink",
          )}
        >
          <Globe size={14} aria-hidden="true" />
          {t("bank.tabs.public")}
        </button>
        <button
          type="button"
          onClick={() => switchTab("personal")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "personal"
              ? "bg-brand-soft text-brand"
              : "text-ink-soft hover:bg-muted hover:text-ink",
          )}
        >
          <BookOpen size={14} aria-hidden="true" />
          {t("bank.tabs.personal")}
        </button>
      </div>

      {/* Collapsible filter bar */}
      <div
        style={{
          maxHeight: filtersOpen ? "800px" : "0px",
          opacity: filtersOpen ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease-out",
        }}
      >
        <div className="border-b border-line bg-panel px-8 py-5">
          <div className="space-y-4">

            {/* Subjects — multi-select chips */}
            {subjects.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  {t("bank.filters.subject")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => {
                    const active = local.subjects.includes(s.id);
                    const Icon = getSubjectIcon(s.name);
                    const colorClass = getSubjectColor(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSubject(s.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 active:scale-95",
                          active
                            ? cn(colorClass, "border-transparent")
                            : "border-line text-ink-soft hover:border-brand/40 hover:text-ink",
                        )}
                      >
                        <Icon size={11} aria-hidden="true" />
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topics — cascades from selected subjects */}
            {visibleTopics.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  {t("bank.filters.topic")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {visibleTopics.map((tp) => {
                    const active = local.topics.includes(tp.id);
                    return (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => toggleTopic(tp.id)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 active:scale-95",
                          active
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-line text-ink-soft hover:border-brand/40 hover:text-ink",
                        )}
                      >
                        {translateTopicName(tp.name, locale)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="h-px bg-line" />

            {/* Attribute filters row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {/* Question type */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  {t("bank.filters.type")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUESTION_TYPES.map((type) => {
                    const active = local.types.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-150 active:scale-95",
                          active
                            ? "border-brand bg-brand text-white"
                            : "border-line text-ink-soft hover:border-brand/50 hover:text-ink",
                        )}
                      >
                        {t(`question.type.${type}` as Parameters<typeof t>[0])}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden h-10 w-px bg-line sm:block" />

              {/* Difficulty */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  {t("bank.filters.difficulty")}
                </p>
                <div className="flex items-center gap-1.5">
                  {DIFFICULTY_LEVELS.map(({ value: diff, bars, activeColor }) => {
                    const active = local.difficulties.includes(diff);
                    const label = t(`difficulty.${diff}` as Parameters<typeof t>[0]);
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => toggleDifficulty(diff)}
                        title={label}
                        aria-label={label}
                        aria-pressed={active}
                        className={cn(
                          "flex items-end gap-[3px] rounded-lg border px-2.5 py-1.5 transition-all duration-150 active:scale-95",
                          active
                            ? "border-transparent bg-muted"
                            : "border-line hover:border-brand/40",
                        )}
                      >
                        {[1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={cn(
                              "w-1.5 rounded-[2px] transition-colors duration-150",
                              i === 1 ? "h-2" : i === 2 ? "h-3.5" : "h-5",
                              i <= bars
                                ? active
                                  ? activeColor
                                  : "bg-ink-soft"
                                : "bg-line",
                            )}
                          />
                        ))}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden h-10 w-px bg-line sm:block" />

              {/* Adapted + Clear */}
              <div className="flex items-center gap-4 self-end pb-[2px]">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-ink-soft">
                  <input
                    type="checkbox"
                    checked={local.adapted}
                    onChange={(e) => setAdapted(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-line accent-brand"
                  />
                  {t("bank.filters.adaptedOnly")}
                </label>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[11px] font-semibold text-ink-faint transition-colors hover:text-danger"
                  >
                    <X size={12} aria-hidden="true" />
                    {t("bank.filters.clear")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 px-8 py-6">
        {activeTab === "public" &&
        questions.length === 0 &&
        !filters.q &&
        activeFilterCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Globe size={24} className="text-brand" aria-hidden="true" />
            </div>
            <p className="font-semibold text-ink">{t("bank.public.comingSoon")}</p>
            <p className="mt-1 max-w-xs text-sm text-ink-soft">
              {t("bank.public.comingSoonDesc")}
            </p>
          </div>
        ) : activeTab === "personal" && questions.length === 0 && activeFilterCount === 0 && !filters.q ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <BookOpen size={24} className="text-ink-soft" aria-hidden="true" />
            </div>
            <p className="font-semibold text-ink">{t("bank.questions.empty")}</p>
            <p className="mt-1 max-w-xs text-sm text-ink-soft">
              Questions you create in your sheets will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Results bar with select-all */}
            <div className="mb-5 flex items-center gap-3">
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={allSelected ? clearSelection : selectAll}
                  aria-label={allSelected ? "Deselect all" : t("bank.selection.selectAll")}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                    allSelected
                      ? "border-brand bg-brand"
                      : someSelected
                        ? "border-brand bg-brand/30"
                        : "border-line hover:border-brand/60",
                  )}
                >
                  {(allSelected || someSelected) && (
                    <Check size={9} className="text-white" strokeWidth={3} aria-hidden="true" />
                  )}
                </button>
              )}
              <p className="text-sm text-ink-soft">
                {questions.length === 0
                  ? t("bank.questions.empty")
                  : questions.length === 1
                    ? t("bank.questions.count_one", { n: 1 })
                    : t("bank.questions.count_many", { n: questions.length })}
              </p>
            </div>

            {activeTab === "personal" && groupedList ? (
              <div className="space-y-8">
                {groupedList.map(({ key, name, qs }) => {
                  const Icon = getSubjectIcon(name);
                  const colorClass = getSubjectColor(name);
                  const groupIds = qs.map((q) => q.id);
                  const allGroupSelected = groupIds.every((id) => selectedIds.has(id));
                  return (
                    <section key={key}>
                      <div className="mb-3 flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                            colorClass,
                          )}
                        >
                          <Icon size={13} aria-hidden="true" />
                        </span>
                        <h2
                          className="text-[13px] font-bold text-ink"
                          style={{ letterSpacing: "-0.01em" }}
                        >
                          {name}
                        </h2>
                        <span className="text-[11px] text-ink-faint">({qs.length})</span>
                        <div className="ml-1 h-px flex-1 bg-line" />
                        {/* Select group button */}
                        <button
                          type="button"
                          onClick={() => selectGroup(groupIds)}
                          className={cn(
                            "text-[11px] font-semibold transition-colors",
                            allGroupSelected ? "text-brand hover:text-ink-soft" : "text-ink-faint hover:text-brand",
                          )}
                        >
                          {allGroupSelected ? "Deselect" : t("bank.selection.selectGroup")}
                        </button>
                      </div>
                      <div className={cols === 3 ? "grid grid-cols-3 gap-3" : cols === 2 ? "grid grid-cols-2 gap-3" : "space-y-2.5"}>
                        {qs.map((q) => (
                          <BankQuestionCard
                            key={q.id}
                            question={q}
                            isPersonal
                            selected={selectedIds.has(q.id)}
                            inSelectionMode={inSelectionMode}
                            onToggleSelect={toggleSelect}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className={cols === 3 ? "grid grid-cols-3 gap-3" : cols === 2 ? "grid grid-cols-2 gap-3" : "space-y-2.5"}>
                {questions.map((q) => (
                  <BankQuestionCard
                    key={q.id}
                    question={q}
                    isPersonal={false}
                    selected={selectedIds.has(q.id)}
                    inSelectionMode={inSelectionMode}
                    onToggleSelect={toggleSelect}
                    onAddToSheet={handleSingleAdd}
                    sheets={sheets}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add question modal */}
      <AddToBankModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        subjects={subjects}
        allTopics={allTopics}
        sheets={sheets}
      />

      {/* Floating multi-select action bar */}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-200",
          inSelectionMode ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <div className="pointer-events-auto rounded-2xl border border-line bg-surface shadow-[0_12px_40px_rgba(27,20,48,0.13)]">
          {/* Gradient accent line */}
          <div className="h-[3px] rounded-t-2xl btn-gradient" />

          <div className="flex items-center gap-3 px-5 py-3">
            {/* Count badge */}
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-brand px-2 text-[11px] font-bold text-white">
              {selectedIds.size}
            </span>

            <div className="h-4 w-px bg-line" />

            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              {t("bank.selection.clear")}
            </button>

            {/* Add to sheet — both tabs */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSheetPickerOpen((v) => !v)}
                disabled={bulkWorking}
                className="btn-gradient flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {bulkWorking ? t("bank.selection.adding") : t("bank.selection.addToSheet")}
                <ChevronDown size={12} aria-hidden="true" />
              </button>

              {sheetPickerOpen && (
                <SheetPicker
                  sheets={sheets}
                  working={bulkWorking}
                  onSelect={handleAddToSheet}
                  onClose={() => setSheetPickerOpen(false)}
                />
              )}
            </div>

            {/* Delete — personal tab only */}
            {activeTab === "personal" && (
              <>
                <div className="h-4 w-px bg-line" />
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkWorking}
                  className="flex items-center gap-1.5 rounded-xl border border-danger/20 bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger transition-all hover:bg-danger hover:text-white disabled:opacity-60"
                >
                  <Trash2 size={12} aria-hidden="true" />
                  {t("bank.selection.deleteSelected")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
