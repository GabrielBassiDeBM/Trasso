"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInAction, sendMagicLinkAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

const authInitialState: AuthActionState = { error: null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [mode, setMode] = useState<"password" | "magic">("password");

  const [passwordState, passwordAction, passwordPending] = useActionState(signInAction, authInitialState);
  const [magicState, magicAction, magicPending] = useActionState(sendMagicLinkAction, authInitialState);

  return (
    <Card className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Entrar</h1>
      <p className="mt-1 text-sm text-ink-soft">Acesse sua conta para continuar montando suas listas.</p>

      <div className="mt-6 inline-flex rounded-full border border-ink/10 bg-canvas p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-colors",
            mode === "password" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
          )}
        >
          Senha
        </button>
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-colors",
            mode === "magic" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
          )}
        >
          Link por e-mail
        </button>
      </div>

      {mode === "password" ? (
        <form action={passwordAction} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@escola.com.br" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
          </div>
          {passwordState.error && <p className="text-sm text-accent">{passwordState.error}</p>}
          <Button type="submit" className="w-full" disabled={passwordPending}>
            {passwordPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      ) : (
        <form action={magicAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="magic-email">E-mail</Label>
            <Input id="magic-email" name="email" type="email" required autoComplete="email" placeholder="voce@escola.com.br" />
          </div>
          {magicState.error && <p className="text-sm text-accent">{magicState.error}</p>}
          {magicState.success && <p className="text-sm text-brand">{magicState.success}</p>}
          <Button type="submit" variant="outline" className="w-full" disabled={magicPending}>
            {magicPending ? "Enviando…" : "Enviar link de acesso"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          Crie a sua agora
        </Link>
      </p>
    </Card>
  );
}
