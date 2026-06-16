"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createOrgAction } from "@/lib/actions/orgs";
import { Input, Label } from "@/components/ui/Input";
import { buttonStyles } from "@/components/ui/Button";

const initial = { error: null };

export default function NewOrgPage() {
  const [state, formAction, pending] = useActionState(createOrgAction, initial);

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="w-full max-w-[480px]">
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs font-medium text-ink-faint hover:text-ink">
            ← Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink" style={{ letterSpacing: "-0.02em" }}>
              Create organization
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Organize sheets with your team. All members can view and edit content.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                name="name"
                placeholder="e.g. Jefferson High, Ms. Rivera's Class…"
                autoFocus
                required
              />
            </div>

            {state.error && (
              <p role="alert" className="text-sm text-danger">{state.error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard" className={buttonStyles("ghost", "sm")}>
                Cancel
              </Link>
              <button type="submit" disabled={pending} className={buttonStyles("primary", "sm")}>
                {pending ? "Creating…" : "Create organization"}
                {!pending && <ArrowRight size={15} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
