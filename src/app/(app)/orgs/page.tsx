import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Plus, ArrowRight, Users } from "lucide-react";
import { getUserOrgs } from "@/lib/data/sheets";
import { buttonStyles } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Organizations — trasso" };

export default async function OrgsPage() {
  const orgs = await getUserOrgs();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface/82 px-8 py-4 backdrop-blur-[8px]">
        <h1 className="text-[20px] font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
          Organizations
        </h1>
        <Link href="/orgs/new" className={buttonStyles("primary", "sm")}>
          <Plus size={15} />
          New organization
        </Link>
      </header>

      <div className="flex-1 px-8 py-7">
        {orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft" aria-hidden="true">
              <Building2 size={24} className="text-brand" />
            </div>
            <p className="font-semibold text-ink">No organizations yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink-soft">
              Create an organization to share sheets with your team, manage members, and set default cover templates.
            </p>
            <Link href="/orgs/new" className={`mt-6 ${buttonStyles("primary", "sm")}`}>
              Create organization
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map(({ org, role }) => (
              <Link
                key={org.id}
                href={`/orgs/${org.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
                    <Building2 size={18} className="text-brand" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold capitalize text-ink-soft">
                    {role === "dono" ? "Owner" : role === "admin" ? "Admin" : "Member"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-ink group-hover:text-brand-dark transition-colors">
                    {org.name}
                  </p>
                  {org.slug && (
                    <p className="mt-0.5 text-xs text-ink-faint">@{org.slug}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <Users size={12} />
                  View details
                  <ArrowRight size={12} className="ml-auto group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
