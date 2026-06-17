import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Library } from "lucide-react";
import { getSheetsWithTaxonomy, getDashboardStats, getSubjects, getTopics } from "@/lib/data/sheets";
import { SheetsGrid } from "@/components/dashboard/SheetsGrid";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Dashboard — trasso",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ exam_type?: string; subject_id?: string; search?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: { user } }, sheets, stats, subjects, allTopics, locale] = await Promise.all([
    supabase.auth.getUser(),
    getSheetsWithTaxonomy({ examType: sp.exam_type, subjectId: sp.subject_id, search: sp.search }),
    getDashboardStats(),
    getSubjects(),
    getTopics(),
    getLocale(),
  ]);

  const t = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) =>
    translate(locale, key, vars);

  const displayName =
    user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "teacher";

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting.morning");
    if (h < 18) return t("dashboard.greeting.afternoon");
    return t("dashboard.greeting.evening");
  }

  const EXAM_FILTERS = [
    { value: "", label: t("dashboard.filter.all") },
    { value: "prova", label: t("dashboard.filter.tests") },
    { value: "lista", label: t("dashboard.filter.problemSets") },
    { value: "simulado", label: t("dashboard.filter.practicetests") },
    { value: "recuperacao", label: t("dashboard.filter.reviews") },
  ] as const;

  const activeFilter = sp.exam_type ?? "";
  const activeSubject = sp.subject_id ?? "";

  const sheetsFoundLabel = sheets.length === 1
    ? t("dashboard.sheetsFound_one", { n: sheets.length })
    : t("dashboard.sheetsFound_many", { n: sheets.length });

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopbar />

      <div className="flex flex-1">
        {/* Main content */}
        <div className="min-w-0 flex-1 px-8 py-7">
          {/* Greeting */}
          <div className="mb-7">
            <h2 className="text-[26px] font-extrabold text-ink" style={{ letterSpacing: "-0.02em" }}>
              {getGreeting()}, {displayName} 👋
            </h2>
            <p className="mt-1 text-[15px] text-ink-soft">
              {sheets.length === 0 ? t("dashboard.createFirst") : sheetsFoundLabel}
            </p>
          </div>

          {/* Stat cards */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <StatCard
              icon={FileText}
              label={t("dashboard.sheetsCreated")}
              value={String(stats.sheetsCount)}
              tintBg="bg-brand-soft"
              tintText="text-brand"
            />
            <StatCard
              icon={Library}
              label={t("dashboard.questionsInBank")}
              value={String(stats.questionsCount)}
              tintBg="bg-accent-soft"
              tintText="text-accent-dark"
            />
          </div>

          {/* Exam type filter chips */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {EXAM_FILTERS.map((f) => {
              const params = new URLSearchParams();
              if (f.value) params.set("exam_type", f.value);
              if (activeSubject) params.set("subject_id", activeSubject);
              if (sp.search) params.set("search", sp.search);
              return (
                <Link
                  key={f.value}
                  href={`/dashboard?${params.toString()}`}
                  className={cn(
                    "rounded-full border px-4 py-1 text-xs font-semibold transition-colors",
                    activeFilter === f.value
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-surface text-ink-soft hover:border-brand/40 hover:text-ink"
                  )}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>

          {sheets.length === 0 ? (
            <EmptyState hasFilter={!!activeFilter || !!activeSubject || !!sp.search} t={t} />
          ) : (
            <SheetsGrid sheets={sheets} subjects={subjects} allTopics={allTopics} />
          )}
        </div>

        {/* Right panel — subject filter */}
        <aside className="hidden w-56 flex-shrink-0 border-l border-line px-5 py-7 lg:block">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            {t("dashboard.subject")}
          </p>
          <div className="flex flex-col gap-1">
            {(() => {
              const params = new URLSearchParams();
              if (activeFilter) params.set("exam_type", activeFilter);
              if (sp.search) params.set("search", sp.search);
              return (
                <Link
                  href={`/dashboard?${params.toString()}`}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    activeSubject === ""
                      ? "bg-brand-soft text-brand"
                      : "text-ink-soft hover:bg-muted hover:text-ink"
                  )}
                >
                  {t("dashboard.allSubjects")}
                </Link>
              );
            })()}

            {subjects.map((subject) => {
              const params = new URLSearchParams();
              if (activeFilter) params.set("exam_type", activeFilter);
              params.set("subject_id", subject.id);
              if (sp.search) params.set("search", sp.search);
              return (
                <Link
                  key={subject.id}
                  href={`/dashboard?${params.toString()}`}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    activeSubject === subject.id
                      ? "bg-brand-soft text-brand"
                      : "text-ink-soft hover:bg-muted hover:text-ink"
                  )}
                >
                  {subject.name}
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tintBg,
  tintText,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tintBg: string;
  tintText: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tintBg}`} aria-hidden="true">
          <Icon size={17} className={tintText} />
        </span>
        <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      </div>
      <span className="font-mono text-[32px] font-semibold leading-none tracking-tight text-ink">
        {value}
      </span>
    </div>
  );
}

function EmptyState({ hasFilter, t }: { hasFilter: boolean; t: (k: Parameters<typeof translate>[1]) => string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft" aria-hidden="true">
        <FileText size={24} className="text-brand" />
      </div>
      <p className="font-semibold text-ink">
        {hasFilter ? t("dashboard.emptyFiltered.title") : t("dashboard.empty.title")}
      </p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">
        {hasFilter ? t("dashboard.emptyFiltered.hint") : t("dashboard.empty.hint")}
      </p>
    </div>
  );
}
