"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

const authInitialState: AuthActionState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, authInitialState);

  return (
    <Card className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Criar conta</h1>
      <p className="mt-1 text-sm text-ink-soft">Monte suas listas e provas em minutos, com gabarito incluído.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="displayName">Nome</Label>
          <Input id="displayName" name="displayName" type="text" autoComplete="name" placeholder="Seu nome" />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@escola.com.br" />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Mínimo de 6 caracteres"
          />
        </div>
        {state.error && <p className="text-sm text-accent">{state.error}</p>}
        {state.success && <p className="text-sm text-brand">{state.success}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
