"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Settings,
  Plus,
  Building2,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/client";

interface SidebarProps {
  onNew: () => void;
  userName?: string | null;
  userEmail?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onNew, userName, userEmail, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const t = useT();

  const NAV = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/banco", label: t("nav.questionBank"), icon: Library },
    { href: "/classes", label: t("nav.classes"), icon: Users },
    { href: "/gabarito", label: t("nav.grading"), icon: ClipboardCheck },
    { href: "/orgs", label: t("nav.organizations"), icon: Building2 },
  ];

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-line bg-surface px-4 py-5",
        "fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "sm:static sm:z-auto sm:h-full sm:translate-x-0 sm:transition-none",
      )}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        onClick={onClose}
        className="mb-5 flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-muted"
      >
        <Image src="/trasso-logo.svg" alt="trasso" width={32} height={32} className="h-8 w-8" />
        <span className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.025em" }}>
          trasso
        </span>
      </Link>

      {/* New sheet button */}
      <button
        onClick={onNew}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white btn-gradient focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
      >
        <Plus size={16} />
        {t("nav.newSheet")}
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/orgs" && href !== "/classes" && pathname.startsWith(href + "/")) ||
            (href === "/orgs" && pathname.startsWith("/orgs")) ||
            (href === "/classes" && pathname.startsWith("/classes"));

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                active
                  ? "bg-brand-soft text-brand-dark"
                  : "text-ink-soft hover:bg-muted hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={17}
                aria-hidden="true"
                className={active ? "text-brand" : "text-ink-soft"}
              />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="mt-auto flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold leading-none text-brand"
          aria-hidden="true"
        >
          {(userName ?? userEmail ?? "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{userName ?? t("nav.myProfile")}</p>
          {userEmail && (
            <p className="truncate text-[11px] text-ink-faint">{userEmail}</p>
          )}
        </div>
        <Link
          href="/settings"
          onClick={onClose}
          aria-label={t("nav.settings")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-muted-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Settings size={14} />
        </Link>
      </div>
    </aside>
  );
}
