import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Library } from "lucide-react";
import { getSheets, getDashboardStats } from "@/lib/data/sheets";
import { SheetCard } from "@/components/dashboard/SheetCard";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Dashboard — trasso",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const EXAM_FILTERS = [
  { value: "", label: "All" },
  { value: "prova", label: "Tests" },
  { value: "lista", label: "Problem Sets" },
  { value: "simulado", label: "Practice Tests" },
  { value: "recuperacao", label: "Reviews" },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ exam_type?: string; search?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: { user } }, sheets, stats] = await Promise.all([
    supabase.auth.getUser(),
    getSheets({ examType: sp.exam_type, search: sp.search }),
    getDashboardStats(),
  ]);

  const displayName =
    user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "teacher";

  const activeFilter = sp.exam_type ?? "";

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopbar />

      <div className="flex-1 px-8 py-7">
        {/* Greeting */}
        <div className="mb-7">
          <h2 className="text-[26px] font-extrabold text-ink" style={{ letterSpacing: "-0.02em" }}>
            {getGreeting()}, {displayName} 👋
          </h2>
          <p className="mt-1 text-[15px] text-ink-soft">
            {sheets.length === 0
              ? "Create your first sheet to get started."
              : `${sheets.length} sheet${sheets.length !== 1 ? "s" : ""} found.`}
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <StatCard
            icon={FileText}
            label="Sheets created"
            value={String(stats.sheetsCount)}
            tintBg="bg-brand-soft"
            tintText="text-brand"
          />
          <StatCard
            icon={Library}
            label="Questions in bank"
            value={String(stats.questionsCount)}
            tintBg="bg-accent-soft"
            tintText="text-[#1187f0]"
          />
        </div>

        {/* Filter chips */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h2 className="text-[18px] font-bold text-ink mr-1" style={{ letterSpacing: "-0.01em" }}>
            Sheets
          </h2>
          {EXAM_FILTERS.map((f) => {
            const params = new URLSearchParams();
            if (f.value) params.set("exam_type", f.value);
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
          <EmptyState hasFilter={!!activeFilter || !!sp.search} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((sheet, i) => (
              <SheetCard key={sheet.id} sheet={sheet} index={i} />
            ))}
          </div>
        )}
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

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft" aria-hidden="true">
        <FileText size={24} className="text-brand" />
      </div>
      <p className="font-semibold text-ink">
        {hasFilter ? "No sheets found" : "No sheets yet"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">
        {hasFilter
          ? "Try removing filters or creating a new sheet."
          : 'Click "New Sheet" in the sidebar to create your first test or problem set.'}
      </p>
    </div>
  );
}
