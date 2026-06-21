"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createOrgAction } from "@/lib/actions/orgs";
import { Input, Label } from "@/components/ui/Input";
import { buttonStyles } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

const initial = { error: null };

export default function NewOrgPage() {
  const t = useT();
  const [state, formAction, pending] = useActionState(createOrgAction, initial);

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="w-full max-w-[480px]">
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs font-medium text-ink-faint hover:text-ink">
            {t("editor.backToDashboard")}
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-heading text-ink">
              {t("orgs.create")}
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              {t("orgs.new.desc")}
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="org-name">{t("orgs.new.nameLabel")}</Label>
              <Input
                id="org-name"
                name="name"
                placeholder={t("orgs.new.namePlaceholder")}
                autoFocus
                required
              />
            </div>

            {state.error && (
              <p role="alert" className="text-sm text-danger">{state.error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard" className={buttonStyles("ghost", "sm")}>
                {t("common.cancel")}
              </Link>
              <button type="submit" disabled={pending} className={buttonStyles("primary", "sm")}>
                {pending ? t("orgs.new.creating") : t("orgs.create")}
                {!pending && <ArrowRight size={15} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
