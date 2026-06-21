"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function DashboardTopbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const currentSearch = searchParams.get("search") ?? "";

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/95 px-8 py-4 backdrop-blur-[8px]">
      <h1 className="text-xl font-bold tracking-heading text-ink">
        {t("dashboard.title")}
      </h1>

      <div className="relative ml-auto w-72">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          key={currentSearch}
          defaultValue={currentSearch}
          placeholder={t("dashboard.searchPlaceholder")}
          aria-label={t("dashboard.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 hover:border-brand/40"
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(e); }}
          onBlur={handleSearch}
        />
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          aria-label={t("notifications.title")}
          aria-expanded={notifOpen}
          onClick={() => setNotifOpen((v) => !v)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Bell size={17} className="text-ink-soft" />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="text-sm font-semibold text-ink">{t("notifications.title")}</p>
                <button
                  onClick={() => setNotifOpen(false)}
                  aria-label={t("notifications.close")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-muted hover:text-ink"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                <Bell size={28} className="mb-3 text-ink-faint" aria-hidden="true" />
                <p className="text-sm font-medium text-ink">{t("notifications.empty")}</p>
                <p className="mt-1 text-xs text-ink-faint">{t("notifications.emptyDesc")}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
