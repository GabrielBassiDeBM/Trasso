"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/client";

const authInitialState: AuthActionState = { error: null };

export function SignupForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(signUpAction, authInitialState);

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-semibold text-ink">{t("auth.signup.heading")}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t("auth.signup.subhead")}</p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="displayName">{t("auth.signup.name")}</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder={t("auth.signup.namePlaceholder")}
          />
        </div>
        <div>
          <Label htmlFor="email">{t("auth.signup.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.signup.emailPlaceholder")}
          />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.signup.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t("auth.signup.passwordPlaceholder")}
          />
        </div>
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state.success && <p role="status" className="text-sm text-brand">{state.success}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("auth.signup.submitting") : t("auth.signup.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t("auth.signup.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          {t("auth.signup.signIn")}
        </Link>
      </p>
    </Card>
  );
}
