"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Search, X } from "lucide-react";

export function DashboardTopbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      <h1 className="text-[20px] font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
        Dashboard
      </h1>

      <div className="relative ml-auto w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        <input
          key={currentSearch}
          defaultValue={currentSearch}
          placeholder="Search sheets…"
          aria-label="Search sheets"
          className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 hover:border-brand/40"
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(e); }}
          onBlur={handleSearch}
        />
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          aria-label="Notifications"
          aria-expanded={notifOpen}
          onClick={() => setNotifOpen((v) => !v)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface transition-colors hover:bg-[#f1f0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Bell size={17} className="text-ink-soft" />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                <button
                  onClick={() => setNotifOpen(false)}
                  aria-label="Close notifications"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-[#f1f0f5] hover:text-ink"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                <Bell size={28} className="mb-3 text-ink-faint" aria-hidden="true" />
                <p className="text-sm font-medium text-ink">No notifications</p>
                <p className="mt-1 text-xs text-ink-faint">Invite alerts and activity will appear here.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
