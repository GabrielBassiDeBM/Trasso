"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { NewSheetModal } from "@/components/dashboard/NewSheetModal";
import type { SubjectRow, TopicRow } from "@/lib/data/sheets";

interface AppShellProps {
  children: ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  subjects?: SubjectRow[];
  allTopics?: TopicRow[];
}

export function AppShell({ children, userName, userEmail, subjects = [], allTopics = [] }: AppShellProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-canvas">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] sm:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        onNew={() => { setSidebarOpen(false); setModalOpen(true); }}
        userName={userName}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile topbar — only visible below sm breakpoint */}
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Menu size={20} />
          </button>
          <Image src="/trasso-logo.svg" alt="" width={24} height={24} className="h-6 w-6" aria-hidden="true" />
          <span className="text-base font-bold text-ink" style={{ letterSpacing: "-0.02em" }}>
            trasso
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <NewSheetModal open={modalOpen} onClose={() => setModalOpen(false)} subjects={subjects} allTopics={allTopics} />
    </div>
  );
}
