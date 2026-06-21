"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInAction, sendMagicLinkAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/client";

const authInitialState: AuthActionState = { error: null };

export function LoginForm() {
  const t = useT();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [mode, setMode] = useState<"password" | "magic">("password");

  const [passwordState, passwordAction, passwordPending] = useActionState(signInAction, authInitialState);
  const [magicState, magicAction, magicPending] = useActionState(sendMagicLinkAction, authInitialState);

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-semibold text-ink">{t("auth.login.heading")}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t("auth.login.subhead")}</p>

      <div className="mt-6 inline-flex rounded-full border border-line bg-canvas p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-colors",
            mode === "password" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
          )}
        >
          {t("auth.login.tabPassword")}
        </button>
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-colors",
            mode === "magic" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
          )}
        >
          {t("auth.login.tabMagic")}
        </button>
      </div>

      {mode === "password" ? (
        <form action={passwordAction} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <Label htmlFor="email">{t("auth.login.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t("auth.login.emailPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder={t("auth.login.passwordPlaceholder")}
            />
          </div>
          {passwordState.error && <p role="alert" className="text-sm text-danger">{passwordState.error}</p>}
          <Button type="submit" className="w-full" disabled={passwordPending}>
            {passwordPending ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>
        </form>
      ) : (
        <form action={magicAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="magic-email">{t("auth.login.email")}</Label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t("auth.login.emailPlaceholder")}
            />
          </div>
          {magicState.error && <p role="alert" className="text-sm text-danger">{magicState.error}</p>}
          {magicState.success && <p role="status" className="text-sm text-brand">{magicState.success}</p>}
          <Button type="submit" variant="outline" className="w-full" disabled={magicPending}>
            {magicPending ? t("auth.login.sending") : t("auth.login.sendLink")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t("auth.login.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          {t("auth.login.createOne")}
        </Link>
      </p>
    </Card>
  );
}
